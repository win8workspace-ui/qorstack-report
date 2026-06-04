# Render Endpoint Usage

This document reflects the current public render API and SDK methods.

## Endpoints

| Output                        | Endpoint                                           | Node.js SDK                                   | .NET SDK                                    |
| ----------------------------- | -------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| PDF/DOCX from Word template   | `POST /render/word/template`                       | `api.render.postRenderWordTemplate(request)`  | `api.PostRenderWordTemplateAsync(request)`  |
| Excel from Excel template     | `POST /render/excel/template`                      | `api.render.postRenderExcelTemplate(request)` | `api.PostRenderExcelTemplateAsync(request)` |
| Saved sandbox payload preview | `POST /render/word/template-sandbox/{templateKey}` | generated client method, if exposed           | frontend/internal sandbox flow              |

Authentication uses the `X-API-KEY` header.

## Word/PDF Request

```json
{
  "templateKey": "invoice-q4",
  "fileName": "invoice-101",
  "fileType": "pdf",
  "replace": {
    "customer_name": "John Doe",
    "invoice_date": "2026-04-07"
  },
  "table": [
    {
      "rows": [
        { "desc": "Item A", "qty": 1, "price": 100 },
        { "desc": "Item B", "qty": 2, "price": 50 }
      ],
      "sort": [{ "field": "desc", "direction": "asc" }],
      "verticalMerge": ["desc"],
      "collapse": []
    }
  ],
  "image": {
    "logo": {
      "src": "https://example.com/logo.png",
      "width": 100,
      "height": 50,
      "fit": "contain"
    }
  },
  "qrcode": {
    "payment": {
      "text": "https://example.com/pay/invoice-101",
      "size": 120
    }
  },
  "barcode": {
    "order_id": {
      "text": "ORD-2026-001",
      "format": "Code128",
      "width": 200,
      "height": 50,
      "includeText": true
    }
  }
}
```

Set `fileType` to `"docx"` when you want the generated Word file instead of PDF.

## Excel Request

```json
{
  "templateKey": "sales-report",
  "fileName": "sales-report-q4",
  "replace": {
    "report_date": "2026-04-07"
  },
  "table": [
    {
      "columns": ["category", "name", "qty", "price"],
      "rows": [
        { "category": "Services", "name": "Service A", "qty": 2, "price": 100 },
        { "category": "Services", "name": "Service B", "qty": 1, "price": 200 }
      ],
      "autoFilter": true,
      "freezeHeader": true,
      "autoFitColumns": true
    }
  ]
}
```

## Success Response

```json
{
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "downloadUrl": "https://example.com/presigned-download-url",
  "expiresIn": 3600,
  "fileType": "pdf",
  "status": "Completed",
  "isZipped": false
}
```

## Node.js SDK

```ts
import { QorstackApi, PdfFromTemplateRequest } from "qorstack-report-sdk";

const api = new QorstackApi({
  baseUrl: process.env.QORSTACK_API_URL || "http://localhost:8080",
  securityData: {
    headers: {
      "X-API-KEY": process.env.QORSTACK_API_KEY || "YOUR_API_KEY",
    },
  },
});

const request: PdfFromTemplateRequest = {
  templateKey: "invoice-q4",
  fileName: "invoice-101",
  replace: {
    customer_name: "John Doe",
  },
};

const response = await api.render.postRenderWordTemplate(request);
const { downloadUrl } = response.data;
```

## .NET SDK

```csharp
using Qorstack.Report.Sdk;

var apiUrl = Environment.GetEnvironmentVariable("QORSTACK_API_URL") ?? "http://localhost:8080";
var apiKey = Environment.GetEnvironmentVariable("QORSTACK_API_KEY") ?? "YOUR_API_KEY";
var api = new QorstackApi(apiUrl, apiKey);

var request = new PdfFromTemplateRequest
{
    TemplateKey = "invoice-q4",
    FileName = "invoice-101",
    Replace = new Dictionary<string, string>
    {
        ["customer_name"] = "John Doe"
    }
};

var response = await api.PostRenderWordTemplateAsync(request);
var downloadUrl = response.DownloadUrl;
```
