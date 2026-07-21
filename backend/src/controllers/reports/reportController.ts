import { Request, Response } from "express";
import { deleteReportService, generateReportService, getReportDownloadService, getReportService, getReportsService, updateReportService } from "../../services/reports/reportService.js";
import { GenerateReportRequest, UpdateReportRequest } from "../../types/reports/report.js";

export const generateReportController = async (req: Request<{}, {}, GenerateReportRequest>, res: Response) => {
  await generateReportService((req as any).user.id, req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getReportsController = async (req: Request, res: Response) => {
  await getReportsService((req as any).user.id, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getReportController = async (req: Request, res: Response) => {
  await getReportService((req as any).user.id, Number(req.params.id), (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const downloadReportController = async (req: Request, res: Response) => {
  const format = req.query.format === "xml" ? "xml" : "pdf";

  await getReportDownloadService((req as any).user.id, Number(req.params.id), format, (error, data) => {
    if (error || !data) {
      return res.status((error as any)?.statusCode || 500).json(error);
    }

    res.setHeader("Content-Type", data.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${data.fileName}"`);

    if (data.content) {
      return res.send(data.content);
    }

    return res.download(data.filePath!, data.fileName);
  });
};

export const updateReportController = async (req: Request<{ id: string }, {}, UpdateReportRequest>, res: Response) => {
  await updateReportService((req as any).user.id, Number(req.params.id), req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const deleteReportController = async (req: Request, res: Response) => {
  await deleteReportService((req as any).user.id, Number(req.params.id), (result) => {
    return res.status(result.statusCode).json(result);
  });
};
