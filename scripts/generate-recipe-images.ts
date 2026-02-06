#!/usr/bin/env npx tsx
/**
 * Generate thumbnail images for all recipes using OpenAI DALL-E 3
 *
 * Usage: npx tsx scripts/generate-recipe-images.ts
 *
 * Requires: OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local from project root
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// Rate limiting: 1 request per 13 seconds (Tier 1 = 5 images/min)
const RATE_LIMIT_MS = 13000;

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
}

function generatePrompt(recipeTitle: string): string {
  return `A delicious plate of ${recipeTitle}, appetizing food photography, overhead view on a rustic wooden table, soft natural lighting, warm earthy tones matching palette (#d4846a, #faf9f7, #3d3531), minimalist styling, fresh herb garnishes, no text, no watermarks, clean simple background`;
}

async function generateImage(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.data[0].url;
    }

    const error = await response.json();

    // Check for rate limit error (429)
    if (response.status === 429 && attempt < retries) {
      const waitTime = Math.pow(2, attempt) * 30000; // 30s, 60s, 120s
      console.log(`   ⏳ Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${retries}...`);
      await sleep(waitTime);
      continue;
    }

    throw new Error(`OpenAI API error (${response.status}): ${JSON.stringify(error)}`);
  }

  throw new Error('Max retries exceeded');
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToSupabase(buffer: Buffer, filename: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('recipe-images')
    .upload(filename, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload error: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

async function updateRecipeImageUrl(recipeId: string, imageUrl: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ image_url: imageUrl })
    .eq('id', recipeId);

  if (error) {
    throw new Error(`Failed to update recipe: ${error.message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

async function main() {
  console.log('🍽️  Recipe Image Generator');
  console.log('==========================\n');

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
    console.error('❌ Missing required environment variables');
    console.error('   Ensure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY are set in .env.local');
    process.exit(1);
  }

  // Fetch recipes without images
  console.log('📋 Fetching recipes without images...');
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, image_url')
    .or('image_url.is.null,image_url.eq.')
    .order('title');

  if (error) {
    console.error('❌ Failed to fetch recipes:', error.message);
    process.exit(1);
  }

  if (!recipes || recipes.length === 0) {
    console.log('✅ All recipes already have images!');
    return;
  }

  const total = recipes.length;
  console.log(`📸 Found ${total} recipes without images\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors: { title: string; error: string }[] = [];

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i] as Recipe;
    const progress = `(${i + 1}/${total})`;

    try {
      console.log(`🎨 Generating image for "${recipe.title}" ${progress}...`);

      // Generate image with DALL-E 3
      const prompt = generatePrompt(recipe.title);
      const imageUrl = await generateImage(prompt);

      // Download the generated image
      console.log(`   ⬇️  Downloading...`);
      const imageBuffer = await downloadImage(imageUrl);

      // Upload to Supabase Storage
      const filename = `${sanitizeFilename(recipe.title)}-${recipe.id.substring(0, 8)}.png`;
      console.log(`   ⬆️  Uploading to storage...`);
      const publicUrl = await uploadToSupabase(imageBuffer, filename);

      // Update recipe with image URL
      await updateRecipeImageUrl(recipe.id, publicUrl);

      console.log(`   ✅ Done! ${publicUrl}\n`);
      successCount++;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.log(`   ❌ Error: ${errorMessage}\n`);
      errors.push({ title: recipe.title, error: errorMessage });
      errorCount++;
    }

    // Rate limit - wait before next request (except for last item)
    if (i < recipes.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  // Summary
  console.log('\n==========================');
  console.log('📊 Summary');
  console.log('==========================');
  console.log(`✅ Success: ${successCount}/${total}`);
  console.log(`❌ Errors:  ${errorCount}/${total}`);

  if (errors.length > 0) {
    console.log('\n❌ Failed recipes:');
    errors.forEach(e => {
      console.log(`   - ${e.title}: ${e.error}`);
    });
  }
}

main().catch(console.error);
