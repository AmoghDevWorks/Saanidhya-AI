import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.routes.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.voice import (
    RespondRequest,
    SynthesizeRequest,
    SynthesisResponse,
    TranscriptionResponse,
    VoiceResponse,
)
from app.services.gnani_service import (
    GnaniIntegrationUnavailable,
    evon_service,
    prisma_service,
    timbre_service,
)

logger = logging.getLogger("saanidhya.voice")
router = APIRouter(prefix="", tags=["Voice"])


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    audio: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
):
    del current_user
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="Audio payload is empty.")
    try:
        result = await prisma_service.transcribe(
            content,
            audio.filename or "audio",
            audio.content_type or "application/octet-stream",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GnaniIntegrationUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prisma transcription failed")
        raise HTTPException(
            status_code=502, detail="Prisma transcription failed."
        ) from exc
    return TranscriptionResponse(
        transcript=result["transcript"] or "",
        language=result.get("language"),
    )


@router.post("/respond", response_model=VoiceResponse)
async def respond(
    payload: RespondRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    del current_user
    try:
        return await evon_service.respond(
            payload.transcript, payload.conversation, payload.language
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GnaniIntegrationUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Evon response generation failed")
        raise HTTPException(status_code=502, detail="Evon request failed.") from exc


@router.post("/synthesize", response_model=SynthesisResponse)
async def synthesize(
    payload: SynthesizeRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    del current_user
    try:
        return await timbre_service.synthesize(
            payload.response_text, payload.language
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GnaniIntegrationUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Timbre synthesis failed")
        raise HTTPException(status_code=502, detail="Timbre request failed.") from exc