import React from 'react'

type Props = {
    name: string;
    titleComponent?: React.ReactNode; // --- NEW: Optional component to render next to the title ---
    buttonComponent?: React.ReactNode;
    isSmallText?: boolean;
    compact?: boolean; // reduce vertical spacing and gaps
    className?: string; // optional class override
}

const Header = ({
    name,
    titleComponent, // --- NEW ---
    buttonComponent,
        isSmallText = false,
        compact = true,
        className = ''
}: Props) => {
    const containerClasses = `flex flex-wrap w-full items-center justify-between gap-2 md:gap-3 border-b border-gray-100 dark:border-dark-tertiary ${
        compact ? 'py-2 mb-3 px-3 md:px-4' : 'py-3 mb-5 px-3 md:px-4'
    } ${className}`;

    return (
        <div className={containerClasses}>
        {/* --- NEW: Group for title and title-side components --- */}
                <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
                    <h1 
                        className={`${isSmallText ? "text-base sm:text-lg md:text-xl" : "text-lg sm:text-xl md:text-2xl"} font-semibold text-gray-900 dark:text-white`}
                    >
                {name}
            </h1>
            {titleComponent}
        </div>
        {buttonComponent}
    </div>
  )
}

export default Header