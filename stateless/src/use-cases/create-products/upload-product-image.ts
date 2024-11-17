// import { putObject } from '@adapters/secondary/s3-adapter';
// import { config } from '@config/index';
// import { ApplicantDocument } from '@use-cases/append-employee-id';
// import { logger, schemaValidator } from '@shared';
// import { uploadDocument } from '@adapters/secondary/people-hr-adapter';
// import { fetchDocument } from '@adapters/secondary/talos-adapter';
// import { schema } from '@schemas/applicant-document';

// export async function fetchDocument(blobUrl: string): Promise<Buffer> {
//     const response = await axios.get(blobUrl, { responseType: 'arraybuffer' });
  
//     return Buffer.from(response.data);
//   }

// export async function uploadProductImages(document: ApplicantDocument) {






//   const buffer = await fetchDocument(document.url);

//   logger.info('Processing file: ', document.name);

//   await putObject(
//     talosDocumentsBucket,
//     `${document.employeeId}/${document.name}`,
//     buffer,
//   );

//   const base64String = buffer.toString('base64');

//   schemaValidator(schema, document);

//   await uploadDocument(document, peopleHrApiKey, peopleHrDocsUrl, base64String);
// }
