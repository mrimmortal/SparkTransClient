import json
import struct
from typing import Any


MAX_METADATA_BYTES = 64 * 1024
DEFAULT_MAX_AUDIO_PACKET_BYTES = 512 * 1024


class PacketValidationError(ValueError):
    pass


def validate_audio_metadata(metadata: dict[str, Any], audio_bytes: bytes, max_packet_bytes: int = DEFAULT_MAX_AUDIO_PACKET_BYTES) -> None:
    if not isinstance(metadata, dict):
        raise PacketValidationError("metadata must be a JSON object")

    metadata_bytes = json.dumps(metadata, separators=(",", ":")).encode("utf-8")
    if len(metadata_bytes) > MAX_METADATA_BYTES:
        raise PacketValidationError("metadata exceeds 64 KiB")
    if 4 + len(metadata_bytes) + len(audio_bytes) > max_packet_bytes:
        raise PacketValidationError("audio packet exceeds server limit")

    sample_rate = metadata.get("sampleRate")
    if not isinstance(sample_rate, int) or sample_rate <= 0:
        raise PacketValidationError("sampleRate must be a positive integer")

    channels = metadata.get("channels", 1)
    if not isinstance(channels, int) or channels <= 0 or channels > 8:
        raise PacketValidationError("channels must be an integer from 1 to 8")

    if metadata.get("format", "pcm_s16le") != "pcm_s16le":
        raise PacketValidationError("format must be pcm_s16le")

    alignment = channels * 2
    if len(audio_bytes) % alignment != 0:
        raise PacketValidationError("audio byte length must align with channels * 2")

    frames = metadata.get("frames")
    if frames is not None and frames * alignment != len(audio_bytes):
        raise PacketValidationError("frames must match audio byte length")


def encode_audio_packet(metadata: dict[str, Any], audio_bytes: bytes, max_packet_bytes: int = DEFAULT_MAX_AUDIO_PACKET_BYTES) -> bytes:
    validate_audio_metadata(metadata, audio_bytes, max_packet_bytes)
    metadata_bytes = json.dumps(metadata, separators=(",", ":")).encode("utf-8")
    return struct.pack("<I", len(metadata_bytes)) + metadata_bytes + bytes(audio_bytes)

