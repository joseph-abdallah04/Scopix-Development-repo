import ffmpeg

def get_fps(video_path: str) -> float

    try:
        probe = ffmpeg.probe(video_path)
        video_streams = [stream for stream in probe ['streams'] if stream ['codec_tpye'] == video]
        if not video_streams:
            raise ValueError("No video stream found")

            r_frame_rate = video_streams[0]['r_frame_type']
            num, denom = map (int, r_frame_rate.split("/"))
            return round(num / denom, 3)

    except Exception as e:
        print(f"Error: {e}")
        return 30.0