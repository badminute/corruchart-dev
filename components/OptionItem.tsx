"use client";

type Props = {
    slot: any;
    option: any;
    index: number;
    state: number;
    options: any[];
    activePluses: any[];
    activeVariant: Record<string, number>;
    isHolding: string | null;
    description?: string;
    openDescription: string | null;
    setOpenDescription: (id: string | null) => void;
    setActiveVariant: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    cycleColor: (index: number) => void;
    getPlusImage: (option: any, state: number) => string;
    holdTimerRef: React.MutableRefObject<any>;
    didLongPressRef: React.MutableRefObject<boolean>;
    setIsHolding: (id: string | null) => void;
};

export default function OptionItem({
    slot,
    option,
    index,
    state,
    options,
    activePluses,
    activeVariant,
    isHolding,
    description,
    openDescription,
    setOpenDescription,
    setActiveVariant,
    cycleColor,
    getPlusImage,
    holdTimerRef,
    didLongPressRef,
    setIsHolding,
}: Props) {
    return (
        <div className="relative">
            <div className="flex items-center gap-2 p-2 rounded w-full h-full">
                {/* STAR */}
                <div className="relative flex justify-center items-center">
                    <button onClick={() => cycleColor(index)} className="relative">
                        <svg
                            className="cursor-pointer"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill={["#828282ff", "#e74c3c", "#fc8d59", "#27ae60", "#37bdf6ff", "#c88de8ff"][state]}
                            stroke="#000"
                            strokeWidth="0.5"
                        >
                            <path d="M12 2.5l2.9 6.1 6.7.6-5 4.4 1.5 6.5L12 16.8 5.9 20.1l1.5-6.5-5-4.4 6.7-.6L12 2.5z" />
                        </svg>

                        {activePluses
                            .filter(p => p.index === index)
                            .map(p => (
                                <img
                                    key={p.id}
                                    src={getPlusImage(option, p.state)}
                                    className="absolute -top-6 -right-3 pointer-events-none animate-pop-plus w-5"
                                />
                            ))}

                        {/* Swap icon top-left, smaller, grey */}
                        {slot.options.length > 1 && (
                            <span
                                className="absolute -top-1 -left-1 text-[12px] text-gray-400 cursor-pointer select-none z-10"
                                title="Swap variants"
                                onClick={(e) => {
                                    e.stopPropagation(); // prevent tooltip opening
                                    setActiveVariant(prev => ({
                                        ...prev,
                                        [slot.slotId]:
                                            ((prev[slot.slotId] ?? 0) + 1) % slot.options.length,
                                    }));
                                }}
                            >
                                ⇄
                            </span>
                        )}
                    </button>
                </div>



                {/* LABEL */}
                <span
                    onPointerDown={() => {
                        if (slot.options.length <= 1) return;

                        didLongPressRef.current = false;
                        setIsHolding(slot.slotId);

                        holdTimerRef.current = setTimeout(() => {
                            didLongPressRef.current = true;
                            setIsHolding(null);

                            setActiveVariant(prev => ({
                                ...prev,
                                [slot.slotId]:
                                    ((prev[slot.slotId] ?? 0) + 1) % slot.options.length,
                            }));
                        }, 400);
                    }}
                    onPointerUp={() => {
                        clearTimeout(holdTimerRef.current);
                        setIsHolding(null);
                    }}
                    onPointerLeave={() => {
                        clearTimeout(holdTimerRef.current);
                        setIsHolding(null);
                    }}
                    onClick={() => {
                        if (didLongPressRef.current || !description) return;
                        setOpenDescription(openDescription === option.id ? null : option.id);
                    }}
                    className="relative text-lg px-1 py-0.5 cursor-pointer select-none"
                >
                    <span
                        className={`absolute inset-0 bg-violet-400/20 origin-left scale-x-0 transition-transform duration-[400ms]
              ${isHolding === slot.slotId ? "scale-x-100" : ""}
            `}
                    />
                    {option.label}
                </span>
            </div>

            {/* DESCRIPTION */}
            {openDescription === option.id && description && (
                <div className="absolute bottom-full mb-2 left-0 right-0 flex justify-center z-50">
                    <div className="max-w-xs bg-neutral-800 text-gray-200 px-4 py-3 rounded animate-pop-in">
                        {description}
                    </div>
                </div>
            )}
        </div>
    );
}
