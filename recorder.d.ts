class Recorder {
    constructor(source: AudioBufferSourceNode, config?: {
        workerPath?: string,
        bufferLen?: number,
        callback?: Function,
        type?: string
    });
    public record(): void;
    public stop(): void;
    public clear(): void;
    public getBuffer(cb: Function): void;
    public exportWAV(cb: Function, type?: string): void;
    public static forceDownload(blob: Blob, filename: string): void;
}
export default Recorder;
