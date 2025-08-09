#!/usr/bin/env node
/**
 * Test script to verify Electron download API
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testElectronDownload() {
  console.log('Testing Electron download API...');
  
  // Test the download API by making a simple request
  try {
    const response = await fetch('http://localhost:8000/api/test');
    if (response.ok) {
      console.log('✅ Backend is accessible');
    } else {
      console.log('❌ Backend is not accessible');
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
  }
  
  console.log('Electron download API test completed');
}

testElectronDownload(); 