using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QorstackReportService.Application.Common.Interfaces;
using QorstackReportService.Application.Analytics.Models;

namespace QorstackReportService.Application.Analytics.Queries.GetTemplatePerformance;

public record GetTemplatePerformanceQuery(
    string Range = "7D",
    Guid? ProjectId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null
) : IRequest<List<TemplatePerformanceDto>>;

public class GetTemplatePerformanceQueryHandler : IRequestHandler<GetTemplatePerformanceQuery, List<TemplatePerformanceDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IUser _currentUser;

    public GetTemplatePerformanceQueryHandler(IApplicationDbContext context, IUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<TemplatePerformanceDto>> Handle(GetTemplatePerformanceQuery request, CancellationToken cancellationToken)
    {
        var userIdStr = _currentUser.Id;
        if (userIdStr == null) return new List<TemplatePerformanceDto>();
        var userId = Guid.Parse(userIdStr);

        // Resolve date range filter
        DateTime? fromUtc = request.FromDate;
        DateTime? toUtc = request.ToDate;

        if (!fromUtc.HasValue && !string.IsNullOrEmpty(request.Range))
        {
            var todayUtc = DateTime.UtcNow.Date;
            fromUtc = request.Range.ToUpperInvariant() switch
            {
                "24H" => todayUtc.AddDays(-1),
                "7D" => todayUtc.AddDays(-7),
                "30D" => todayUtc.AddDays(-30),
                "THISMONTH" => new DateTime(todayUtc.Year, todayUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                _ => todayUtc.AddDays(-7)
            };
            if (!toUtc.HasValue) toUtc = todayUtc.AddDays(1).AddTicks(-1);
        }

        // Compute from ReportJobs — authoritative source for generation metrics.
        var jobsQuery = _context.ReportJobs
            .Where(r => r.UserId == userId && r.TemplateVersionId != null);

        if (fromUtc.HasValue)
            jobsQuery = jobsQuery.Where(r => r.CreatedDatetime >= fromUtc.Value);

        if (toUtc.HasValue)
            jobsQuery = jobsQuery.Where(r => r.CreatedDatetime <= toUtc.Value);

        var jobs = await jobsQuery
            .Select(r => new
            {
                r.TemplateVersionId,
                r.Status,
                r.DurationMs,
                r.FileSizeBytes,
                r.CreatedDatetime
            })
            .ToListAsync(cancellationToken);

        if (jobs.Count == 0) return new List<TemplatePerformanceDto>();

        var versionIds = jobs.Select(j => j.TemplateVersionId!.Value).Distinct().ToList();
        var versionInfo = await _context.TemplateVersions
            .Where(v => versionIds.Contains(v.Id))
            .Include(v => v.Template)
                .ThenInclude(t => t.Project)
            .ToListAsync(cancellationToken);

        var versionLookup = versionInfo.ToDictionary(v => v.Id);

        // Apply project filter
        if (request.ProjectId.HasValue)
        {
            var filteredVersionIds = versionInfo
                .Where(v => v.Template?.ProjectId == request.ProjectId.Value)
                .Select(v => v.Id)
                .ToHashSet();
            jobs = jobs.Where(j => filteredVersionIds.Contains(j.TemplateVersionId!.Value)).ToList();
        }

        // Group by TemplateId (combining all versions of the same template)
        var grouped = jobs
            .Where(j => versionLookup.ContainsKey(j.TemplateVersionId!.Value))
            .GroupBy(j => versionLookup[j.TemplateVersionId!.Value].TemplateId);

        return grouped.Select(g =>
        {
            // Pick the highest-version metadata in this group
            var representativeVersionId = g.First().TemplateVersionId!.Value;
            var templateVersion = versionLookup[representativeVersionId];
            foreach (var job in g)
            {
                if (versionLookup.TryGetValue(job.TemplateVersionId!.Value, out var v) && v.Version > templateVersion.Version)
                    templateVersion = v;
            }

            var templateKey = templateVersion.Template?.TemplateKey ?? "unknown";
            var templateName = templateVersion.Template?.Name ?? "Unknown";
            var projectName = templateVersion.Template?.Project?.Name ?? "Unknown";
            var filePath = templateVersion.FilePath ?? "";

            var type = filePath.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase) ||
                       filePath.EndsWith(".xls", StringComparison.OrdinalIgnoreCase)
                ? "Excel" : "PDF";

            var totalGenerations = g.Count();
            var errorCount = g.Count(j => string.Equals(j.Status, "failed", StringComparison.OrdinalIgnoreCase));
            var successCount = totalGenerations - errorCount;

            // Avg duration only across jobs that have a recorded duration (i.e. completed).
            var jobsWithDuration = g.Where(j => j.DurationMs.HasValue).ToList();
            var avgDuration = jobsWithDuration.Count > 0
                ? jobsWithDuration.Average(j => (double)j.DurationMs!.Value)
                : 0;

            var jobsWithSize = g.Where(j => j.FileSizeBytes.HasValue).ToList();
            var avgFileSize = jobsWithSize.Count > 0
                ? (long)jobsWithSize.Average(j => (double)j.FileSizeBytes!.Value)
                : 0;

            var successRate = totalGenerations > 0
                ? Math.Round(((double)successCount / totalGenerations) * 100, 1) : 0;
            var errorRate = totalGenerations > 0
                ? Math.Round(((double)errorCount / totalGenerations) * 100, 1) : 0;

            var lastGeneratedAt = g.Max(j => j.CreatedDatetime);

            // Per-day volume across the requested range (fill missing days with 0)
            var dailyVolume = new List<int>();
            if (fromUtc.HasValue && toUtc.HasValue)
            {
                var perDay = g
                    .Where(j => j.CreatedDatetime.HasValue)
                    .GroupBy(j => j.CreatedDatetime!.Value.Date)
                    .ToDictionary(x => x.Key, x => x.Count());

                var fromDay = fromUtc.Value.Date;
                var toDay = toUtc.Value.Date;
                for (var d = fromDay; d <= toDay; d = d.AddDays(1))
                    dailyVolume.Add(perDay.TryGetValue(d, out var count) ? count : 0);
            }

            return new TemplatePerformanceDto(
                templateKey, templateName, projectName, type,
                totalGenerations, avgDuration, avgFileSize,
                errorCount, successRate, errorRate, lastGeneratedAt,
                dailyVolume);
        })
        .OrderByDescending(x => x.TotalGenerations)
        .ToList();
    }
}
