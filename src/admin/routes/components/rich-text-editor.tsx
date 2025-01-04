import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { IconButton } from "@medusajs/ui"
import {
    PhotoSolid,
    ListBullet,
    ArrowUpRightOnBox
} from "@medusajs/icons"

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
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
`

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
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

    const addImage = (e: React.MouseEvent) => {
        e.preventDefault()
        const url = window.prompt('Enter image URL:')
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }

    const addLink = (e: React.MouseEvent) => {
        e.preventDefault()
        const url = window.prompt('Enter URL:')
        if (url) {
            editor.chain().focus().setLink({ href: url }).run()
        }
    }

    return (
        <div className="border border-ui-border-base rounded-lg">
            <style>{editorStyles}</style>
            <div className="border-b border-ui-border-base p-2 flex flex-wrap gap-1 bg-ui-bg-base">
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

                <div className="w-px h-6 mx-2 bg-ui-border-base" />

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

                <div className="w-px h-6 mx-2 bg-ui-border-base" />

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
                    <ListBullet color='green' />
                </EditorButton>

                <div className="w-px h-6 mx-2 bg-ui-border-base" />

                <EditorButton onClick={addImage}>
                    <PhotoSolid />
                </EditorButton>
                <EditorButton
                    onClick={addLink}
                    variant={editor.isActive('link') ? 'primary' : 'transparent'}
                >
                    <ArrowUpRightOnBox />
                </EditorButton>
            </div>

            <div className="bg-white">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}

export default RichTextEditor