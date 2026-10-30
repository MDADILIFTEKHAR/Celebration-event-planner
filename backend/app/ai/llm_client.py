import json
import logging
import httpx
from typing import Optional, Dict, Any, Tuple
from ..config import settings

logger = logging.getLogger("celebration_planner.ai")

class AIProviderStatus:
    @staticmethod
    def get_status() -> Dict[str, Any]:
        provider = settings.AI_PROVIDER
        has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here")
        has_openai = bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your_openai_api_key_here")
        
        is_configured = (provider == "gemini" and has_gemini) or (provider == "openai" and has_openai)
        
        return {
            "provider": provider,
            "is_configured": is_configured,
            "mode": "llm_augmented" if is_configured else "deterministic_engine",
            "message": (
                f"Connected to {provider.upper()} API"
                if is_configured
                else "Running on 100% Reliable Local Intelligence Engine (No API key required)"
            )
        }

async def generate_creative_enhancements(context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Optional LLM integration for creative touches and natural conversation.
    Falls back gracefully to None if not configured or if an error occurs.
    """
    status = AIProviderStatus.get_status()
    if not status["is_configured"]:
        return None

    try:
        if settings.AI_PROVIDER == "gemini":
            # Gemini REST API via httpx
            api_key = settings.GEMINI_API_KEY
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            prompt_content = f"You are a celebration event planner. Suggest 2 unique personalized party ideas for this event: {json.dumps(context)}. Return JSON with 'creative_ideas' (list of strings)."
            
            payload = {
                "contents": [{"parts": [{"text": prompt_content}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            }
            
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return json.loads(text)
        elif settings.AI_PROVIDER == "openai":
            # OpenAI REST API via httpx
            api_key = settings.OPENAI_API_KEY
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}"}
            prompt_content = f"You are a celebration event planner. Suggest 2 unique personalized party ideas for this event: {json.dumps(context)}. Return JSON format."
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt_content}],
                "response_format": {"type": "json_object"}
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return json.loads(content)
    except Exception as e:
        logger.warning(f"Optional AI provider request failed ({str(e)}). Safely defaulting to local engine.")
        return None

    return None
