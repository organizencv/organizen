
import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-config";

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

/**
 * Upload de arquivo para o S3
 * @param buffer - Buffer do arquivo
 * @param fileName - Nome do arquivo (pode incluir prefixos/pastas)
 * @returns cloud_storage_path (chave S3)
 */
export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  // Se o fileName já começa com folderPrefix, usa direto
  // Caso contrário, adiciona o folderPrefix + attachments/
  const key = fileName.startsWith(folderPrefix) 
    ? fileName 
    : `${folderPrefix}attachments/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
  });

  await s3Client.send(command);
  return key;
}

/**
 * Gera URL assinada para download de arquivo
 * @param key - cloud_storage_path (chave S3)
 * @returns URL assinada válida por 1 hora
 */
export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

/**
 * Deleta arquivo do S3
 * @param key - cloud_storage_path (chave S3)
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}
