# Stage 1: Build the app using the .NET 8 SDK
FROM ://microsoft.com AS build-env
WORKDIR /app

# Copy csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy all files and compile a Release build
COPY . ./
RUN dotnet publish -c Release -o out

# Stage 2: Runtime image
FROM ://microsoft.com
WORKDIR /app
COPY --from=build-env /app/out .

# Expose port 8080 for Render's routing layer
EXPOSE 8080
ENTRYPOINT ["dotnet", "Qorstack.Report.dll"]
