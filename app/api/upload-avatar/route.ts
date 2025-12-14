import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const userId = formData.get('userId') as string

        if (!file || !userId) {
            return NextResponse.json(
                { error: 'Missing file or userId' },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File size must be less than 2MB' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Only JPG, PNG, and WebP images are allowed' },
                { status: 400 }
            )
        }

        // Use service role key for storage operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/avatar.${fileExt}`

        // Convert File to ArrayBuffer then to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, buffer, {
                upsert: true,
                contentType: file.type,
            })

        if (uploadError) {
            console.error('Storage upload error:', uploadError)
            return NextResponse.json({ error: uploadError.message }, { status: 400 })
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        // Update profile with avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: urlData.publicUrl })
            .eq('id', userId)

        if (updateError) {
            console.error('Profile update error:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, url: urlData.publicUrl })
    } catch (err: any) {
        console.error('Server error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        // List all files in user's folder
        const { data: files, error: listError } = await supabase.storage
            .from('avatars')
            .list(userId)

        if (listError) {
            return NextResponse.json({ error: listError.message }, { status: 400 })
        }

        // Delete all files
        if (files && files.length > 0) {
            const filePaths = files.map((file) => `${userId}/${file.name}`)
            const { error: deleteError } = await supabase.storage
                .from('avatars')
                .remove(filePaths)

            if (deleteError) {
                return NextResponse.json({ error: deleteError.message }, { status: 400 })
            }
        }

        // Update profile to remove avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', userId)

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Server error:', err)
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
