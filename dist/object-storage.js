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
exports.S3 = void 0;
exports.listObjectAndMerge = listObjectAndMerge;
exports.uploadPdfToR2 = uploadPdfToR2;
exports.mergePdfsFromR2 = mergePdfsFromR2;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const client_s3_1 = require("@aws-sdk/client-s3");
const constants_1 = require("./constants");
const pdf_lib_1 = require("pdf-lib");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.S3 = new client_s3_1.S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    },
});
function listObjectAndMerge(Bucket, materialId, type) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const res = yield exports.S3.send(new client_s3_1.ListObjectsV2Command({
                Bucket,
                Prefix: `${type}/topics/${materialId}/`,
            }));
            const arr = (_a = res.Contents) === null || _a === void 0 ? void 0 : _a.map((item) => item.Key);
            arr === null || arr === void 0 ? void 0 : arr.sort();
            var arr2 = [];
            arr === null || arr === void 0 ? void 0 : arr.forEach((item) => {
                const temp = {
                    Key: item,
                    Bucket: constants_1.BUCKET_NAME,
                };
                arr2.push(temp);
            });
            const outputKey = yield mergePdfsFromR2(arr2, constants_1.BUCKET_NAME, type);
            return outputKey;
        }
        catch (err) {
            console.error(err);
        }
    });
}
function uploadPdfToR2(filePath_1, bucket_1, key_1) {
    return __awaiter(this, arguments, void 0, function* (filePath, bucket, key, metadata = {}) {
        try {
            const pdfContent = fs_1.default.readFileSync(filePath);
            // Ensure all metadata values are strings
            const stringMetadata = {};
            for (const [key, value] of Object.entries(metadata)) {
                stringMetadata[key] = String(value);
            }
            yield exports.S3.send(new client_s3_1.PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: pdfContent,
                ContentType: "application/pdf",
                ContentEncoding: "inline",
                CacheControl: "max-age=3600",
                Metadata: stringMetadata,
            }));
            // Clean up the temp file
            fs_1.default.unlinkSync(filePath);
        }
        catch (error) {
            console.error("Failed to upload PDF to R2:", error);
            throw new Error("R2 upload failed");
        }
    });
}
function mergePdfsFromR2(objects, outputBucket, type) {
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
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(exports.S3, getCommand, { expiresIn: 3600 });
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
            const outputKey = `merged/${type}/${Date.now()}.pdf`;
            yield exports.S3.send(new client_s3_1.PutObjectCommand({
                Bucket: outputBucket,
                Key: outputKey,
                Body: mergedPdfBytes,
                ContentType: "application/pdf",
            }));
            fs_1.default.unlinkSync(outputPath);
            return outputKey;
        }
        catch (error) {
            console.error("Error merging PDFs:", error);
            throw new Error("Failed to merge PDFs");
        }
    });
}
