import React from 'react'

type Props = {
    name: string;
    titleComponent?: React.ReactNode; // --- NEW: Optional component to render next to the title ---
    buttonComponent?: React.ReactNode;
    isSmallText?: boolean;
}

const Header = ({
    name,
    titleComponent, // --- NEW ---
    buttonComponent,
    isSmallText = false
}: Props) => {
  return (
    <div className='mb-5 flex w-full items-center justify-between'>
        {/* --- NEW: Group for title and title-side components --- */}
        <div className="flex items-center gap-4">
            <h1 
                className={`${isSmallText ? "text-lg" : "text-2xl"} font-semibold dark:text-white`}
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