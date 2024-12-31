"use client";

import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const Cards = () => {
    const [tokenId, setTokenId] = useState("123"); // Default tokenId
    const [evoImageUrl, setEvoImageUrl] = useState(`/api/images/evo/123`);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTokenId(event.target.value);
    };

    const handleGoClick = () => {
        setEvoImageUrl(`/api/images/evo/${tokenId}`);
    };

    const handleNext = () => {
        const nextId = (parseInt(tokenId) + 1).toString();
        setTokenId(nextId);
        setEvoImageUrl(`/api/images/evo/${nextId}`);
    };

    const handlePrevious = () => {
        const prevId = (parseInt(tokenId) - 1).toString();
        if (parseInt(tokenId) > 1) {
            setTokenId(prevId);
            setEvoImageUrl(`/api/images/evo/${prevId}`);
        }
    };

    return (
        <main className="flex flex-col h-full space-y-6">
            <div className="flex flex-col px-4 pt-6 lg:items-center">
                <h3 className="text-lg font-medium">Evo Cards</h3>
                <p className="text-sm text-muted-foreground !mt-0">
                    View your Evo cards and their details here.
                </p>
            </div>
            <Separator />

            <div className="flex flex-wrap gap-4 items-stretch justify-center w-full pb-6">
                {evoImageUrl ? (
                    <img
                        src={evoImageUrl}
                        alt="Generated Evo"
                        className="w-64 h-auto rounded-lg shadow-lg"
                    />
                ) : (
                    <p className="text-muted-foreground">Loading Evo image...</p>
                )}
            </div>
            <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePrevious}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
                    >
                        ←
                    </button>
                    <input
                        type="text"
                        value={tokenId}
                        onChange={handleInputChange}
                        className="border rounded px-4 py-2 text-center w-24"
                        placeholder="Enter ID"
                    />
                    <button
                        onClick={handleNext}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
                    >
                        →
                    </button>
                </div>
                <button
                    onClick={handleGoClick}
                    className="px-6 py-2 bg-green-500 text-bold rounded hover:bg-green-600"
                >
                    Go
                </button>
            </div>
        </main>
    );
};

export default Cards;
