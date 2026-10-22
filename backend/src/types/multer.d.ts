declare module 'multer' {
    import { Request } from 'express';

    interface MulterFile {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
    }

    interface FileFilterCallback {
        (error: Error | null, acceptFile: boolean): void;
    }

    interface DiskStorageOptions {
        destination?: string | ((req: Request, file: MulterFile, cb: (error: Error | null, destination: string) => void) => void);
        filename?: (req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => void;
    }

    class DiskStorage {
        constructor(options?: DiskStorageOptions);
    }

    interface MulterOptions {
        storage?: DiskStorage;
        fileFilter?: (req: Request, file: MulterFile, cb: FileFilterCallback) => void;
        limits?: {
            fileSize?: number;
            files?: number;
        };
    }

    interface Multer {
        single(fieldname: string): any;
        array(fieldname: string, maxCount?: number): any;
        fields(fields: { name: string; maxCount?: number }[]): any;
        none(): any;
        any(): any;
    }

    function diskStorage(options: DiskStorageOptions): DiskStorage;
    function memoryStorage(): any;

    function multer(options?: MulterOptions): Multer;

    export = multer;
}