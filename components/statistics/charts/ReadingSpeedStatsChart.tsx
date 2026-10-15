import React, {useEffect, useMemo, useRef, useState} from "react";
import {BarChart} from "react-native-gifted-charts";
import {Animated, Dimensions, FlatList, StyleSheet} from "react-native";
import {View, XStack} from "tamagui";

import {ReadingSpeedStatsByParticipant} from "@/types/statistics/ReadingSpeedStats";
import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";

type Props = {
    data: ReadingSpeedStatsByParticipant[];
    height?: number;
    width?: number;
};

const {width: SCREEN_WIDTH} = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_SPACING = 30;
const BAR_COLOR = "#CB5A2E";
const BAR_COLOR_DIMMED = "#CB5A2E80";

// Той самий "bar chart + горизонтальні картки, що гортаються" патерн, що й
// AvgGradeChart — свідомо узгоджено, щоб екран статистики виглядав як одна
// система, а не набір різних віджетів. На відміну від avgGrade (де колір
// бару кодує "наскільки далеко від maxGrade"), для WPM немає усталеного
// порогу "добре/погано", тому бар завжди одного кольору — лише виділений/
// невиділений.
const ReadingSpeedStatsChart: React.FC<Props> = ({data, height = 300, width = 300}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const chartData = useMemo(() => {
        return data.map((item, index) => ({
            stacks: [
                {
                    value: Math.round(item.averageWpm),
                    color: index === selectedIndex ? BAR_COLOR : BAR_COLOR_DIMMED,
                    marginBottom: 0,
                    onPress: () => handleBarPress(index),
                },
            ],
            label: item.participant.name.split(" ")[0],
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, selectedIndex]);

    const yAxisMaxValue = useMemo(() => {
        const maxDataValue = Math.max(...data.map((item) => item.averageWpm), 0);
        return Math.max(Math.ceil((maxDataValue * 1.2) / 10) * 10, 10);
    }, [data]);

    const handleBarPress = (index: number) => {
        setSelectedIndex(index);
        flatListRef.current?.scrollToIndex({index, animated: true, viewPosition: 0.5});
    };

    useEffect(() => {
        const listener = scrollX.addListener(({value}) => {
            const index = Math.round(value / (CARD_WIDTH + CARD_SPACING));
            if (index !== selectedIndex && index >= 0 && index < data.length) {
                setSelectedIndex(index);
            }
        });
        return () => {
            scrollX.removeListener(listener);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIndex, data.length]);

    const renderParticipantCard = ({item, index}: { item: ReadingSpeedStatsByParticipant; index: number }) => {
        const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
        ];
        const scale = scrollX.interpolate({inputRange, outputRange: [0.9, 1, 0.9], extrapolate: "clamp"});

        return (
            <Animated.View
                style={[
                    styles.card,
                    {width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2, transform: [{scale}], gap: 10},
                    index === selectedIndex && styles.selectedCard,
                ]}
            >
                <CustomText size="h4Medium" color="$gray-20">
                    {item.participant.name}
                </CustomText>
                <View gap={2}>
                    <XStack justifyContent="space-between">
                        <CustomText size="p1Regular" color="$gray-40">
                            {i18n.t("reading_speed_wpm")}
                        </CustomText>
                        <CustomText size="p1Regular" color="$gray-20">
                            {Math.round(item.averageWpm)}
                        </CustomText>
                    </XStack>
                    <XStack justifyContent="space-between">
                        <CustomText size="p1Regular" color="$gray-40">
                            {i18n.t("reading_speed_accuracy")}
                        </CustomText>
                        <CustomText size="p1Regular" color="$gray-20">
                            {Math.round(item.averageAccuracy * 100)}%
                        </CustomText>
                    </XStack>
                    <XStack justifyContent="space-between">
                        <CustomText size="p1Regular" color="$gray-40">
                            {i18n.t("reading_speed_stress_accuracy")}
                        </CustomText>
                        <CustomText size="p1Regular" color="$gray-20">
                            {item.averageStressAccuracy !== null
                                ? `${Math.round(item.averageStressAccuracy * 100)}%`
                                : "—"}
                        </CustomText>
                    </XStack>
                    <XStack justifyContent="space-between">
                        <CustomText size="p1Regular" color="$gray-40">
                            {i18n.t("reading_history_title")}
                        </CustomText>
                        <CustomText size="p1Regular" color="$gray-20">
                            {item.attemptsCount}
                        </CustomText>
                    </XStack>
                </View>
            </Animated.View>
        );
    };

    const handleScroll = Animated.event(
        [{nativeEvent: {contentOffset: {x: scrollX}}}],
        {useNativeDriver: false},
    );

    const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number; }; }; }) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
        if (index !== selectedIndex && index >= 0 && index < data.length) {
            setSelectedIndex(index);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                <BarChart
                    stackData={chartData}
                    width={width}
                    height={height}
                    spacing={22}
                    barBorderRadius={4}
                    barWidth={30}
                    xAxisThickness={1}
                    xAxisColor="#C9AE87"
                    xAxisType="dashed"
                    xAxisLabelTextStyle={styles.axisLabel}
                    xAxisLabelsAtBottom={true}
                    hideYAxisText={false}
                    yAxisTextStyle={styles.axisLabel}
                    yAxisExtraHeight={20}
                    yAxisThickness={0}
                    yAxisLabelWidth={40}
                    maxValue={yAxisMaxValue}
                    noOfSections={5}
                    rulesColor="#C9AE87"
                    rulesType="dashed"
                    showVerticalLines={false}
                    dashWidth={5}
                    dashGap={5}
                    hideRules={false}
                />
            </View>

            <FlatList
                ref={flatListRef}
                data={data}
                keyExtractor={(item) => item.participant.id.toString()}
                renderItem={renderParticipantCard}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardListContainer}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                snapToAlignment="center"
                decelerationRate="fast"
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                initialScrollIndex={selectedIndex}
                getItemLayout={(_, index) => ({
                    length: CARD_WIDTH + CARD_SPACING,
                    offset: (CARD_WIDTH + CARD_SPACING) * index,
                    index,
                })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    chartContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    axisLabel: {
        color: "#A68A63",
        fontSize: 12,
        fontFamily: "System",
    },
    cardListContainer: {
        paddingVertical: 10,
        paddingHorizontal: SCREEN_WIDTH * 0.1 - CARD_SPACING / 2,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 15,
        shadowColor: "#1A1209",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F3E7CE",
    },
    selectedCard: {
        backgroundColor: "#FBF6EC",
        borderColor: "#E8DCC3",
    },
});

export default React.memo(ReadingSpeedStatsChart);
