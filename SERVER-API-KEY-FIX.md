# Server-Side API Key Fix Guide

## Problem
Your FastAPI server is getting 401 "No auth credentials found" because it's not reading the API key that the MCP client is now sending in request headers.

## Solution: Update Your FastAPI Server

### 1. Update your `mcp_server.py` imports:
```python
from fastapi import FastAPI, Header
from typing import Optional
```

### 2. Update your tool endpoint to extract API key:
```python
@app.get("/tools/insert_template")
async def insert_template(
    template_path: str,
    json_data_path: str,
    output_path: str,
    x_api_key: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None)
):
    # Extract API key from headers
    api_key = None
    if x_api_key:
        api_key = x_api_key
    elif authorization and authorization.startswith("Bearer "):
        api_key = authorization.replace("Bearer ", "")
    
    print(f"🔑 Received API key: {api_key[:20]}..." if api_key else "❌ No API key received")
    
    # Use this api_key for your OpenAI/OpenRouter client
    # Replace your existing OpenAI client initialization with:
    
    if not api_key:
        return {"error": "API key required", "status": "error"}
    
    # Initialize OpenAI client with received API key
    from openai import OpenAI
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key  # Use the API key from request headers
    )
    
    # Continue with your existing document generation logic...
    # but use the new 'client' with the API key
```

### 3. Alternative: Extract in Middleware (Optional)
If you want to handle API key extraction globally:

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract API key from headers
        api_key = (
            request.headers.get("x-api-key") or
            request.headers.get("authorization", "").replace("Bearer ", "")
        )
        
        # Store in request state
        request.state.api_key = api_key
        
        response = await call_next(request)
        return response

# Add middleware to your FastAPI app
app.add_middleware(APIKeyMiddleware)

# Then in your endpoints, access with: request.state.api_key
```

## Test the Fix

After updating your server:

1. Restart your FastAPI server
2. Run: `node simple-test.js`
3. Should see: ✅ SUCCESS instead of 401 error

## Expected Server Logs

**Before Fix:**
```
ERROR: Error code: 401 - No auth credentials found
```

**After Fix:**
```
🔑 Received API key: sk-or-v1-ff2303362f698...
✅ Document generation successful
```

## Key Points

- ✅ **MCP Client**: Already sending API key in headers (`X-API-Key` and `Authorization: Bearer`)
- 🔧 **Server Fix**: Extract API key from request headers  
- 🔄 **Use API Key**: Pass extracted API key to OpenAI client initialization
- 🧪 **Test**: Run `node simple-test.js` to verify fix

The MCP client is working perfectly - your server just needs to read the API key from the request headers! 