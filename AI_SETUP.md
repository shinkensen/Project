# AI Chatbot Setup Guide

## ⚠️ IMPORTANT: Revoke Exposed API Key

**Your OpenAI API key was exposed in git history. You MUST:**
1. Go to https://platform.openai.com/api-keys
2. Find and REVOKE the key starting with `sk-proj-yoebH_lcqugSM...`
3. Create a NEW API key

## Setting Up OpenAI on Render

### Step 1: Get Your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Give it a name (e.g., "IntelliNotes Production")
4. Copy the key (starts with `sk-proj-...`)

### Step 2: Configure Render Environment Variable
1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service
3. Click on "Environment" in the left sidebar
4. Click "Add Environment Variable"
5. Set:
   - **Key**: `OPENAI-KEY`
   - **Value**: Paste your OpenAI API key
6. Click "Save Changes"
7. Render will automatically redeploy your service

### Step 3: Verify It's Working
Once Render finishes deploying:
1. Open your chatbot page
2. Open browser console (F12 → Console tab)
3. Send a test message
4. Check the Render logs:
   - Go to Render dashboard → Your service → Logs
   - Look for: `OpenAI client initialized: YES`
   - Look for: `API Key present: YES`
   - Look for: `Using OpenAI GPT-3.5-turbo for response generation`

## How It Works

### With OpenAI Configured
- Uses GPT-3.5-turbo AI model
- Intelligent, context-aware responses
- Understands user's uploaded notes
- Natural conversation flow

### Without OpenAI (Fallback)
- Uses rule-based responses
- Basic keyword matching
- Still functional but less intelligent

## Troubleshooting

### "OpenAI not configured" in logs
- Check that `OPENAI-KEY` environment variable is set in Render
- Verify the key is correct (no extra spaces)
- Wait for Render to finish deploying after adding the variable

### API Errors
- Check your OpenAI account has available credits
- Verify the API key hasn't been revoked
- Check OpenAI API status: https://status.openai.com

### High Costs
- Monitor usage at https://platform.openai.com/usage
- Set spending limits in OpenAI account settings
- Consider implementing rate limiting for heavy usage

## Current Configuration
- **Model**: GPT-3.5-turbo
- **Max Tokens**: 500 per response
- **Temperature**: 0.7 (balanced creativity)
- **Cost**: ~$0.0005-0.0015 per message
