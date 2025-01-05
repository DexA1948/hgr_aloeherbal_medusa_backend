// src/admin/components/rich-text-editor/index.tsx

import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { IconButton } from "@medusajs/ui"
import {
    PhotoSolid,
    ListBullet,
    ArrowUpRightOnBox,
    PencilSquare
} from "@medusajs/icons"
import ImageUploadModal from './image-upload-modal'
import WordCounter from './word-counter'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    maxLength?: number
}

const EditorButton = ({ children, ...props }) => (
    <IconButton type="button" {...props}>
        {children}
    </IconButton>
)

const editorStyles = `
  .ProseMirror {
    min-height: 400px;
    padding: 1rem;
    outline: none;
    font-family: ui-sans-serif, system-ui, -apple 
  }
  
  .ProseMirror * + * {
    margin-top: 0.5rem;
  }

  .ProseMirror p {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .ProseMirror h1 {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
    margin: 1.5rem 0 1rem;
  }

  .ProseMirror h2 {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    margin: 1.5rem 0 1rem;
  }

  .ProseMirror ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 1rem 0;
  }

  .ProseMirror ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 1rem 0;
  }

  .ProseMirror li {
    margin: 0.5rem 0;
  }

  .ProseMirror img {
    max-width: 100%;
    height: auto;
    border-radius: 0.375rem;
    margin: 1rem 0;
  }

  .ProseMirror a {
    color: #3b82f6;
    text-decoration: underline;
  }

  .ProseMirror blockquote {
    border-left: 3px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: #6b7280;
  }

  .ProseMirror strong {
    font-weight: 600;
  }

  .ProseMirror em {
    font-style: italic;
  }

  .ProseMirror.ProseMirror-focused {
    outline: none;
  }

  .ProseMirror img.ProseMirror-selectednode {
    outline: 2px solid #3b82f6;
  }
`

const RichTextEditor = ({ content, onChange, maxLength = 50000 }: RichTextEditorProps) => {
    const [showImageModal, setShowImageModal] = useState(false)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-md my-4',
                },
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    if (!editor) {
        return null
    }

    const addLink = (e: React.MouseEvent) => {
        e.preventDefault()
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('Enter URL:', previousUrl)
        
        if (url === null) {
            return
        }

        if (url === '') {
            editor.chain().focus().unsetLink().run()
            return
        }

        editor.chain().focus().setLink({ href: url }).run()
    }

    const handleImageSelect = (url: string) => {
        editor.chain().focus().setImage({ src: url }).run()
    }

    const textContent = editor.getText()
    const isOverLimit = textContent.length > maxLength

    return (
        <div className="border border-ui-border-base rounded-lg">
            <style>{editorStyles}</style>
            
            <div className="border-b border-ui-border-base p-2 flex flex-wrap gap-1 bg-ui-bg-base">
                <div className="flex items-center gap-1">
                    <EditorButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        variant={editor.isActive('bold') ? 'primary' : 'transparent'}
                    >
                        <b>B</b>
                    </EditorButton>
                    <EditorButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        variant={editor.isActive('italic') ? 'primary' : 'transparent'}
                    >
                        <em>i</em>
                    </EditorButton>
                </div>

                <div className="w-px h-6 mx-2 bg-ui-border-base" />

                <div className="flex items-center gap-1">
                    <EditorButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        variant={editor.isActive('heading', { level: 1 }) ? 'primary' : 'transparent'}
                    >
                        H1
                    </EditorButton>
                    <EditorButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        variant={editor.isActive('heading', { level: 2 }) ? 'primary' : 'transparent'}
                    >
                        H2
                    </EditorButton>
                </div>

                <div className="w-px h-6 mx-2 bg-ui-border-base" />

                <div className="flex items-center gap-1">
                    <EditorButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        variant={editor.isActive('bulletList') ? 'primary' : 'transparent'}
                    >
                        <ListBullet />
                    </EditorButton>
                    <EditorButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        variant={editor.isActive('orderedList') ? 'primary' : 'transparent'}
                    >
                        <PencilSquare />
                    </EditorButton>
                </div>

                <div className="w-px h-6 mx-2 bg-ui-border-base" />

                <div className="flex items-center gap-1">
                    <EditorButton 
                        onClick={() => setShowImageModal(true)}
                        title="Insert image"
                    >
                        <PhotoSolid />
                    </EditorButton>
                    <EditorButton
                        onClick={addLink}
                        variant={editor.isActive('link') ? 'primary' : 'transparent'}
                        title="Insert link"
                    >
                        <ArrowUpRightOnBox />
                    </EditorButton>
                </div>
            </div>

            <div className={`bg-white transition-colors ${isOverLimit ? 'bg-red-50' : ''}`}>
                <EditorContent editor={editor} />
            </div>

            <div className="p-2 border-t border-ui-border-base">
                <WordCounter 
                    content={textContent} 
                    maxLength={maxLength} 
                />
            </div>

            <ImageUploadModal 
                open={showImageModal}
                onClose={() => setShowImageModal(false)}
                onImageSelect={handleImageSelect}
            />
        </div>
    )
}

export default RichTextEditor