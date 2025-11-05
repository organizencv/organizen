
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getBucketConfig } from '@/lib/aws-config';

export async function GET() {
  try {
    const config = getBucketConfig();
    
    console.log('Testando configuração S3...');
    console.log('Bucket:', config.bucketName);
    console.log('Prefix:', config.folderPrefix);
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('AWS_PROFILE:', process.env.AWS_PROFILE);
    console.log('AWS_ACCESS_KEY_ID presente:', !!process.env.AWS_ACCESS_KEY_ID);
    console.log('AWS_SECRET_ACCESS_KEY presente:', !!process.env.AWS_SECRET_ACCESS_KEY);
    
    // Tentar fazer upload de um arquivo de teste
    const s3Client = new S3Client({});
    const testKey = `${config.folderPrefix}test-${Date.now()}.txt`;
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: testKey,
      Body: Buffer.from('Test upload from OrganiZen'),
      ContentType: 'text/plain'
    });
    
    await s3Client.send(command);
    
    return NextResponse.json({
      success: true,
      message: 'Upload S3 funcionando!',
      testFile: testKey,
      config: {
        bucketName: config.bucketName,
        folderPrefix: config.folderPrefix,
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  } catch (error: any) {
    console.error('Erro ao testar S3:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
      config: {
        bucketName: getBucketConfig().bucketName,
        folderPrefix: getBucketConfig().folderPrefix,
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      }
    }, { status: 500 });
  }
}
