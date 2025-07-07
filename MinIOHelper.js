import { Client } from 'minio';
import { config } from './config.js';
import path from 'path';
import crypto from 'crypto';

export class MinIOHelper {
    constructor() {
        this.client = new Client({
            endPoint: config.minio.endPoint,
            port: config.minio.port,
            useSSL: config.minio.useSSL,
            accessKey: config.minio.accessKey,
            secretKey: config.minio.secretKey
        });
        this.bucket = config.minio.bucket;
    }

    async initialize() {
        try {
            // Check if bucket exists, create if it doesn't
            const bucketExists = await this.client.bucketExists(this.bucket);
            if (!bucketExists) {
                await this.client.makeBucket(this.bucket);
                console.log(`📦 Created MinIO bucket: ${this.bucket}`);
            } else {
                console.log(`📦 MinIO bucket exists: ${this.bucket}`);
            }

            // Set bucket policy to allow public read access
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${this.bucket}/*`]
                    }
                ]
            };

            await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
            console.log(`🔒 Set public read policy for bucket: ${this.bucket}`);

            return true;
        } catch (error) {
            console.error('❌ MinIO initialization failed:', error);
            throw error;
        }
    }

    generateUniqueFileName(originalName) {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        return `${timestamp}_${random}_${baseName}${extension}`;
    }

    async uploadFile(fileBuffer, originalName, mimetype) {
        try {
            const uniqueFileName = this.generateUniqueFileName(originalName);

            console.log(`📁 Uploading to MinIO: ${uniqueFileName} (${fileBuffer.length} bytes)`);

            // Upload file to MinIO
            await this.client.putObject(this.bucket, uniqueFileName, fileBuffer, fileBuffer.length, {
                'Content-Type': mimetype,
                'Cache-Control': 'max-age=3600'
            });

            console.log(`✅ File uploaded to MinIO: ${uniqueFileName}`);

            return {
                fileName: uniqueFileName,
                originalName: originalName,
                size: fileBuffer.length,
                mimetype: mimetype,
                url: this.getFileUrl(uniqueFileName),
                bucket: this.bucket
            };
        } catch (error) {
            console.error('❌ MinIO upload failed:', error);
            throw error;
        }
    }

    getFileUrl(fileName) {
        // Construct the public URL for the file
        const protocol = config.minio.useSSL ? 'https' : 'http';
        const port = config.minio.port === 80 || config.minio.port === 443 ? '' : `:${config.minio.port}`;
        return `${protocol}://${config.minio.endPoint}${port}/${this.bucket}/${fileName}`;
    }

    async getFileBuffer(fileName) {
        try {
            console.log(`📥 Downloading from MinIO: ${fileName}`);

            const chunks = [];
            const stream = await this.client.getObject(this.bucket, fileName);

            return new Promise((resolve, reject) => {
                stream.on('data', chunk => chunks.push(chunk));
                stream.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    console.log(`✅ Downloaded from MinIO: ${fileName} (${buffer.length} bytes)`);
                    resolve(buffer);
                });
                stream.on('error', reject);
            });
        } catch (error) {
            console.error(`❌ MinIO download failed for ${fileName}:`, error);
            throw error;
        }
    }

    async getFileInfo(fileName) {
        try {
            const stat = await this.client.statObject(this.bucket, fileName);
            return {
                fileName: fileName,
                size: stat.size,
                etag: stat.etag,
                lastModified: stat.lastModified,
                mimetype: stat.metaData['content-type'],
                url: this.getFileUrl(fileName)
            };
        } catch (error) {
            console.error(`❌ MinIO stat failed for ${fileName}:`, error);
            throw error;
        }
    }

    async deleteFile(fileName) {
        try {
            console.log(`🗑️ Deleting from MinIO: ${fileName}`);
            await this.client.removeObject(this.bucket, fileName);
            console.log(`✅ Deleted from MinIO: ${fileName}`);
            return true;
        } catch (error) {
            console.error(`❌ MinIO delete failed for ${fileName}:`, error);
            throw error;
        }
    }

    async listFiles(prefix = '') {
        try {
            const stream = this.client.listObjects(this.bucket, prefix, true);
            const files = [];

            return new Promise((resolve, reject) => {
                stream.on('data', (obj) => {
                    files.push({
                        fileName: obj.name,
                        size: obj.size,
                        etag: obj.etag,
                        lastModified: obj.lastModified,
                        url: this.getFileUrl(obj.name)
                    });
                });
                stream.on('end', () => {
                    console.log(`📋 Listed ${files.length} files from MinIO`);
                    resolve(files);
                });
                stream.on('error', reject);
            });
        } catch (error) {
            console.error('❌ MinIO list failed:', error);
            throw error;
        }
    }

    async healthCheck() {
        try {
            await this.client.bucketExists(this.bucket);
            return { status: 'healthy', bucket: this.bucket };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
} 