"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePdfsFromR2 = mergePdfsFromR2;
const pdf_lib_1 = require("pdf-lib");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const object_storage_1 = require("../object-storage");
function mergePdfsFromR2(objects, outputBucket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create temp directory
            const tempDir = path_1.default.join(__dirname, "temp");
            if (!fs_1.default.existsSync(tempDir)) {
                fs_1.default.mkdirSync(tempDir);
            }
            // Download and merge PDFs
            const mergedPdf = yield pdf_lib_1.PDFDocument.create();
            for (const obj of objects) {
                // Get presigned URL
                const getCommand = new client_s3_1.GetObjectCommand({
                    Bucket: obj.Bucket,
                    Key: obj.Key,
                });
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(object_storage_1.S3, getCommand, { expiresIn: 3600 });
                // Download PDF
                const response = yield fetch(url);
                const arrayBuffer = yield response.arrayBuffer();
                const pdfDoc = yield pdf_lib_1.PDFDocument.load(arrayBuffer);
                // Copy pages
                const pages = yield mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                pages.forEach((page) => mergedPdf.addPage(page));
            }
            // Save merged PDF
            const mergedPdfBytes = yield mergedPdf.save();
            const outputPath = path_1.default.join(tempDir, `merged-${Date.now()}.pdf`);
            fs_1.default.writeFileSync(outputPath, mergedPdfBytes);
            // Upload to R2
            const outputKey = `merged/theory/${Date.now()}.pdf`;
            yield object_storage_1.S3.send(new client_s3_1.PutObjectCommand({
                Bucket: outputBucket,
                Key: outputKey,
                Body: mergedPdfBytes,
                ContentType: "application/pdf",
            }));
            // Generate presigned URL for merged PDF
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: outputBucket,
                Key: outputKey,
            });
            const mergedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(object_storage_1.S3, getCommand, { expiresIn: 3600 });
            // Clean up temp files
            fs_1.default.unlinkSync(outputPath);
            return mergedUrl;
        }
        catch (error) {
            console.error("Error merging PDFs:", error);
            throw new Error("Failed to merge PDFs");
        }
    });
}
