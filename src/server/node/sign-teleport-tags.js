#!/usr/bin/env node

/**
 * Sign Teleport Tags Utility
 * 
 * This script adds sessionless signatures to teleport tags in Sanora's HTML files.
 * It generates/loads a keypair, creates signed messages for teleport tags, and 
 * updates the HTML files with proper signature, message, and pubKey attributes.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sessionless from 'sessionless-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths to HTML files
const publicDir = join(__dirname, '../../../public');
const verticalFile = join(publicDir, 'teleportable-products-vertical.html');
const horizontalFile = join(publicDir, 'teleportable-products-horizontal.html');
const keyFile = join(__dirname, 'teleport-keys.json');

/**
 * Simple file-based key storage functions for sessionless
 */
function saveKeys(keys) {
    const keyData = {
        privateKey: keys.privateKey || keys,
        publicKey: keys.pubKey || keys.publicKey, // Handle both pubKey and publicKey
        createdAt: new Date().toISOString(),
        purpose: 'teleport-tag-signing'
    };
    writeFileSync(keyFile, JSON.stringify(keyData, null, 2));
}

function loadKeys() {
    if (!existsSync(keyFile)) {
        return null;
    }
    try {
        const keyData = JSON.parse(readFileSync(keyFile, 'utf8'));
        return {
            privateKey: keyData.privateKey,
            publicKey: keyData.publicKey,
            // Return the full structure for sessionless compatibility
            pubKey: keyData.publicKey
        };
    } catch (error) {
        console.warn('⚠️ Failed to load keys:', error.message);
        return null;
    }
}

/**
 * Get or create sessionless keypair for signing teleport tags
 */
async function getOrCreateKeys() {
    const existingKeys = loadKeys();
    if (existingKeys) {
        console.log('📄 Loading existing keys from', keyFile);
        // Configure sessionless with existing keys
        sessionless.getKeys = () => existingKeys;
        
        return {
            keys: existingKeys,
            privateKey: existingKeys.privateKey,
            publicKey: existingKeys.publicKey
        };
    }

    console.log('🔑 Generating new sessionless keypair...');
    const keys = await sessionless.generateKeys(saveKeys, loadKeys);
    
    return { 
        keys: keys, 
        privateKey: keys.privateKey,
        publicKey: keys.pubKey // Use pubKey from the actual generated keys
    };
}

/**
 * Sign a message for teleport tag authentication
 */
async function signTeleportMessage(keys, content, publicKey) {
    const timestamp = Date.now().toString();
    const message = `${timestamp}:${content}:teleport`;
    const signature = await sessionless.sign(message, keys);
    
    // Convert signature to string if it's not already
    const signatureString = typeof signature === 'string' ? signature : signature.toString();
    
    return {
        message,
        signature: signatureString,
        timestamp,
        pubKey: publicKey
    };
}

/**
 * Update HTML file with signed teleport tag
 */
function updateHTMLFile(filePath, signedData) {
    if (!existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        return false;
    }
    
    console.log('📝 Updating', filePath);
    
    let html = readFileSync(filePath, 'utf8');
    
    // Find the teleport tag and replace signature attributes
    const teleportTagRegex = /<teleport([^>]*)>/;
    const match = html.match(teleportTagRegex);
    
    if (!match) {
        console.error('❌ No teleport tag found in', filePath);
        return false;
    }
    
    // Extract existing attributes and remove any existing signature/message/pubKey
    let existingAttrs = match[1];
    existingAttrs = existingAttrs
        .replace(/\s+signature="[^"]*"/g, '')
        .replace(/\s+message="[^"]*"/g, '')
        .replace(/\s+pubKey="[^"]*"/g, '');
    
    // Add new signature attributes
    const newAttrs = `${existingAttrs} signature="${signedData.signature}" message="${signedData.message}" pubKey="${signedData.pubKey}"`;
    
    // Replace the teleport tag
    const newTeleportTag = `<teleport${newAttrs}>`;
    html = html.replace(teleportTagRegex, newTeleportTag);
    
    // Write updated HTML
    writeFileSync(filePath, html, 'utf8');
    console.log('✅ Updated teleport tag with signature');
    
    return true;
}

/**
 * Main function to sign all teleport tags
 */
async function main() {
    console.log('🚀 Starting teleport tag signing...');
    
    try {
        // Get sessionless keys
        const { keys, publicKey } = await getOrCreateKeys();
        console.log('🔑 Using public key:', publicKey);
        
        // Create content identifier for signing (could be more sophisticated)
        const content = 'planet-nine-marketplace-products';
        const signedData = await signTeleportMessage(keys, content, publicKey);
        
        console.log('✍️ Generated signature:', signedData.signature.substring(0, 16) + '...');
        console.log('📝 Message to sign:', signedData.message);
        
        // Update both HTML files
        const files = [
            { name: 'Vertical', path: verticalFile },
            { name: 'Horizontal', path: horizontalFile }
        ];
        
        let success = true;
        for (const file of files) {
            console.log(`\n📄 Processing ${file.name} layout...`);
            if (!updateHTMLFile(file.path, signedData)) {
                success = false;
            }
        }
        
        if (success) {
            console.log('\n🎉 All teleport tags signed successfully!');
            console.log('📋 Summary:');
            console.log('   Public Key:', signedData.pubKey);
            console.log('   Message:', signedData.message);
            console.log('   Signature:', signedData.signature.substring(0, 32) + '...');
        } else {
            console.log('\n❌ Some files failed to update');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 Error signing teleport tags:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    await main();
}

export { main as signTeleportTags, getOrCreateKeys };