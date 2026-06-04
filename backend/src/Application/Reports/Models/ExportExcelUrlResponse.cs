using System.Text.Json.Serialization;

namespace QorstackReportService.Application.Reports.Models;

/// <summary>
/// Response model for Excel export returning a URL
/// </summary>
public class ExportExcelUrlResponse
{
    [JsonPropertyName("jobId")]
    public Guid JobId { get; set; }

    [JsonPropertyName("downloadUrl")]
    public string? DownloadUrl { get; set; }

    [JsonPropertyName("expiresIn")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "success";

    /// <summary>The file type that was produced ("xlsx", "pdf")</summary>
    [JsonPropertyName("fileType")]
    public string FileType { get; set; } = "xlsx";

    [JsonPropertyName("isZipped")]
    public bool IsZipped { get; set; }

    /// <summary>PDF version of the Excel result for in-browser preview (sandbox only)</summary>
    [JsonPropertyName("pdfPreviewUrl")]
    public string? PdfPreviewUrl { get; set; }

    /// <summary>Sheet name → starting page number (1-based) for sheet tab navigation in PDF preview</summary>
    [JsonPropertyName("sheetPageMap")]
    public Dictionary<string, int>? SheetPageMap { get; set; }

    /// <summary>Sheet name → presigned PDF URL (per-sheet PDF mode for accurate multi-sheet previews)</summary>
    [JsonPropertyName("sheetPdfUrlMap")]
    public Dictionary<string, string>? SheetPdfUrlMap { get; set; }
}
