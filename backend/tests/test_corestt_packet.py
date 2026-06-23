import struct

import pytest

from app.services.corestt_protocol import PacketValidationError, encode_audio_packet


def test_encode_audio_packet_prefixes_metadata_length_little_endian():
    packet = encode_audio_packet(
        {
            "sampleRate": 16000,
            "channels": 1,
            "format": "pcm_s16le",
            "frames": 2,
        },
        b"\x01\x00\x02\x00",
    )

    metadata_length = struct.unpack("<I", packet[:4])[0]

    assert metadata_length == len(packet[4:-4])
    assert packet[-4:] == b"\x01\x00\x02\x00"


def test_encode_audio_packet_rejects_frame_mismatch():
    with pytest.raises(PacketValidationError, match="frames"):
        encode_audio_packet(
            {
                "sampleRate": 16000,
                "channels": 1,
                "format": "pcm_s16le",
                "frames": 3,
            },
            b"\x01\x00\x02\x00",
        )

