class Recorder {
    constructor(source: AudioBufferSourceNode, config?: {
        workerPath: 'js/recorderjs/recorderWorker.js',
        bufferLen: 4096,
        callback: Function,
        type: 'audio/wav'
    });
    public init(stream: MediaStream): Promise<void>;
    public record(): void;
    public stop(): void;
    public clear(): void;
    public getBuffer(cb: Function): void;
    public exportWAV(cb: Function, type?: string): void;
    public static forceDownload(blob: Blob, filename: string): void;
}
export default Recorder;
