// src/admin/components/rich-text-editor/word-counter.tsx

import { Text } from "@medusajs/ui"
import React from "react"

interface WordCounterProps {
    content: string
    maxLength?: number
}

const WordCounter = ({ content, maxLength = 50000 }: WordCounterProps) => {
    const charCount = content.length
    const wordCount = content.trim().split(/\s+/).length
    const remainingChars = maxLength - charCount
    const isNearLimit = remainingChars < maxLength * 0.1 // 10% remaining
    const isOverLimit = remainingChars < 0

    return (
        <div className="flex items-center gap-x-4 text-sm">
            <Text className="text-ui-fg-subtle">
                {wordCount} {wordCount === 1 ? "word" : "words"}
            </Text>
            <Text
                className={`
          ${isOverLimit ? "text-ui-fg-error" : ""}
          ${isNearLimit && !isOverLimit ? "text-ui-fg-warning" : ""}
          ${!isNearLimit && !isOverLimit ? "text-ui-fg-subtle" : ""}
        `}
            >
                {charCount.toLocaleString()}/{maxLength.toLocaleString()} characters
                {isNearLimit && !isOverLimit && " (nearing limit)"}
                {isOverLimit && " (over limit)"}
            </Text>
        </div>
    )
}

export default WordCounter