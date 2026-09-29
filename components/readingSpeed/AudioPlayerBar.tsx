import React, {useEffect, useState} from "react";
import {XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";
import {AudioSource, useAudioPlayer, useAudioPlayerStatus} from "expo-audio";

import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import readingSpeedAttemptApi from "@/api/endpoints/readingSpeedAttemptApi";

interface Props {
    attemptId: number;
}

const formatTime = (seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Аудіо захищене (Bearer-токен, не публічний URL) — тому джерело для
// useAudioPlayer резолвиться асинхронно через readingSpeedAttemptApi.
// getAudioSource (уточнює токен + {uri, headers}), а не передається
// напряму рядком.
export const AudioPlayerBar = ({attemptId}: Props) => {
    const [source, setSource] = useState<AudioSource | undefined>(undefined);
    const [loadFailed, setLoadFailed] = useState(false);

    const player = useAudioPlayer(source);
    const status = useAudioPlayerStatus(player);

    useEffect(() => {
        let cancelled = false;
        readingSpeedAttemptApi.getAudioSource(attemptId)
            .then((resolved) => {
                if (!cancelled) {
                    setSource(resolved);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLoadFailed(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [attemptId]);

    if (loadFailed) {
        return (
            <CustomText size="p2Regular" color="$gray-40">
                {i18n.t("reading_history_audio_unavailable")}
            </CustomText>
        );
    }

    const togglePlay = () => {
        if (status.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;

    return (
        <XStack
            alignItems="center"
            gap={12}
            backgroundColor="#FFFFFF"
            borderRadius={20}
            padding={12}
            borderWidth={1}
            borderColor="$gray-85"
        >
            <XStack
                width={44}
                height={44}
                borderRadius={22}
                backgroundColor="#CB5A2E"
                alignItems="center"
                justifyContent="center"
                onPress={togglePlay}
                pressStyle={{opacity: 0.8}}
                opacity={status.isLoaded ? 1 : 0.5}
                disabled={!status.isLoaded}
            >
                <Feather name={status.playing ? "pause" : "play"} size={20} color="#FFFFFF"/>
            </XStack>
            <YStack flex={1} gap={6}>
                <XStack height={4} borderRadius={2} backgroundColor="$gray-85" overflow="hidden">
                    <XStack height="100%" width={`${progress * 100}%`} backgroundColor="#CB5A2E"/>
                </XStack>
                <CustomText size="p3Regular" color="$gray-40">
                    {formatTime(status.currentTime)} / {formatTime(status.duration)}
                </CustomText>
            </YStack>
        </XStack>
    );
};
