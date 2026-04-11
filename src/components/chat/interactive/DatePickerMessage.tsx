import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import GradientButton from '@components/ui/GradientButton';
import {
    colors,
    radii,
    spacing,
    fontFamilies,
    fontSize,
    fontWeight,
} from '@/theme/tokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 44;
const COLUMN_HEIGHT = ITEM_HEIGHT * 3; // 3 visible rows; centre row = selected

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function parseIsoOrToday(iso?: string): Date {
    if (iso) {
        const d = new Date(iso + 'T12:00:00');
        if (!isNaN(d.getTime())) return d;
    }
    return new Date();
}

function isoFromParts(year: number, month: number, day: number): string {
    const y = year.toString().padStart(4, '0');
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Default selection: mid-year on max allowed year (not Dec 31), clamped to [minBound, maxBound]. */
function defaultDateInRange(minBound: Date, maxBound: Date): Date {
    const y = maxBound.getFullYear();
    const tentative = new Date(y, 5, 15, 12, 0, 0, 0);
    if (tentative.getTime() < minBound.getTime()) return new Date(minBound);
    if (tentative.getTime() > maxBound.getTime()) return new Date(maxBound);
    return tentative;
}

// ─── Single column (ScrollView) ───────────────────────────────────────────────
// ScrollView + snap works on iOS, Android, and web; RNGH Pan often fails on web
// and can fight parent scroll views.

interface ColumnProps {
    data: string[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}

function snapScrollOffset(y: number, length: number): number {
    const raw = Math.round(y / ITEM_HEIGHT);
    const idx = Math.max(0, Math.min(length - 1, raw));
    return idx * ITEM_HEIGHT;
}

const PickerColumn: React.FC<ColumnProps> = React.memo(({ data, selectedIndex, onSelect }) => {
    const scrollRef = useRef<ScrollView>(null);
    const length = data.length;
    const maxOffset = Math.max(0, (length - 1) * ITEM_HEIGHT);

    const scrollToIndex = useCallback(
        (index: number, animated: boolean) => {
            const y = Math.max(0, Math.min(maxOffset, index * ITEM_HEIGHT));
            scrollRef.current?.scrollTo({ y, animated });
        },
        [maxOffset],
    );

    useEffect(() => {
        scrollToIndex(selectedIndex, false);
    }, [selectedIndex, scrollToIndex, length]);

    const handleContentSizeChange = useCallback(() => {
        scrollToIndex(selectedIndex, false);
    }, [selectedIndex, scrollToIndex]);

    const commitOffset = useCallback(
        (y: number) => {
            const snappedY = snapScrollOffset(y, length);
            const idx = Math.round(snappedY / ITEM_HEIGHT);
            scrollRef.current?.scrollTo({ y: snappedY, animated: true });
            if (idx >= 0 && idx < length) {
                onSelect(idx);
            }
        },
        [length, onSelect],
    );

    const handleScrollEnd = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            commitOffset(e.nativeEvent.contentOffset.y);
        },
        [commitOffset],
    );

    return (
        <View style={styles.column}>
            <View style={styles.selectionBand} pointerEvents="none" />
            <ScrollView
                ref={scrollRef}
                style={styles.columnScroll}
                contentContainerStyle={styles.columnScrollContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={Platform.OS === 'ios' ? ITEM_HEIGHT : undefined}
                decelerationRate="fast"
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                onMomentumScrollEnd={handleScrollEnd}
                onContentSizeChange={handleContentSizeChange}
                {...(Platform.OS === 'android'
                    ? { onScrollEndDrag: handleScrollEnd }
                    : {})}
            >
                {data.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                        <View key={`${item}-${index}`} style={styles.item}>
                            <Text
                                style={[
                                    styles.itemText,
                                    isSelected ? styles.itemTextSelected : styles.itemTextMuted,
                                ]}
                            >
                                {item}
                            </Text>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
});
PickerColumn.displayName = 'PickerColumn';

// ─── Date Picker Message ──────────────────────────────────────────────────────

interface DatePickerMessageProps {
    title?: string;
    minDate?: string;
    maxDate?: string;
    onConfirm: (isoDate: string) => void;
}

export const DatePickerMessage: React.FC<DatePickerMessageProps> = ({
    title,
    minDate,
    maxDate,
    onConfirm,
}) => {
    const maxBound = parseIsoOrToday(maxDate);
    const minBound = minDate ? parseIsoOrToday(minDate) : new Date(1900, 0, 1);
    const initial = defaultDateInRange(minBound, maxBound);
    const maxYear = maxBound.getFullYear();
    const minYear = minBound.getFullYear();

    const YEARS = Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => String(maxYear - i),
    );

    const [monthIdx, setMonthIdx] = useState(initial.getMonth());
    const [dayIdx, setDayIdx] = useState(initial.getDate() - 1); // 0-based
    const [yearIdx, setYearIdx] = useState(maxYear - initial.getFullYear());

    const currentYear = maxYear - yearIdx;
    const monthMinIdx = currentYear === minYear ? minBound.getMonth() : 0;
    const monthMaxIdx = currentYear === maxYear ? maxBound.getMonth() : 11;
    const clampedMonthIdx = Math.max(monthMinIdx, Math.min(monthIdx, monthMaxIdx));

    const maxDaysInMonth = daysInMonth(clampedMonthIdx, currentYear);
    const dayMin = currentYear === minYear && clampedMonthIdx === minBound.getMonth()
        ? minBound.getDate()
        : 1;
    const dayMax = currentYear === maxYear && clampedMonthIdx === maxBound.getMonth()
        ? maxBound.getDate()
        : maxDaysInMonth;
    const clampedDayIdx = Math.max(dayMin - 1, Math.min(dayIdx, dayMax - 1));

    const allowedMonths = MONTHS.slice(monthMinIdx, monthMaxIdx + 1);
    const DAYS = Array.from({ length: dayMax - dayMin + 1 }, (_, i) =>
        String(dayMin + i).padStart(2, '0'),
    );

    useEffect(() => {
        if (monthIdx !== clampedMonthIdx) {
            setMonthIdx(clampedMonthIdx);
        }
        // We intentionally compare against the calculated bounds and sync if out of range.
    }, [monthIdx, clampedMonthIdx]);

    useEffect(() => {
        if (dayIdx !== clampedDayIdx) {
            setDayIdx(clampedDayIdx);
        }
        // Keep day aligned when year/month changes narrow the available range.
    }, [dayIdx, clampedDayIdx]);

    const handleConfirm = useCallback(() => {
        onConfirm(isoFromParts(currentYear, clampedMonthIdx, clampedDayIdx + 1));
    }, [clampedDayIdx, clampedMonthIdx, currentYear, onConfirm]);

    return (
        <View style={styles.card}>
            <Text style={styles.label}>{title || 'Select a date'}</Text>
            <View style={styles.columnsRow}>
                <PickerColumn
                    data={allowedMonths}
                    selectedIndex={clampedMonthIdx - monthMinIdx}
                    onSelect={(idx) => setMonthIdx(monthMinIdx + idx)}
                />
                <View style={styles.columnDivider} />
                <PickerColumn
                    data={DAYS}
                    selectedIndex={clampedDayIdx - (dayMin - 1)}
                    onSelect={(idx) => setDayIdx(dayMin - 1 + idx)}
                />
                <View style={styles.columnDivider} />
                <PickerColumn data={YEARS} selectedIndex={yearIdx} onSelect={setYearIdx} />
            </View>
            <GradientButton
                label="Confirm date"
                onPress={handleConfirm}
                size="sm"
                fullWidth
                style={styles.confirmButton}
            />
        </View>
    );
};

DatePickerMessage.displayName = 'DatePickerMessage';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.background,
        borderRadius: radii.radiusMd,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        width: 280,
    },
    label: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
        color: colors.gray,
        textAlign: 'center',
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    columnsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    column: {
        flex: 1,
        height: COLUMN_HEIGHT,
        overflow: 'hidden',
    },
    columnScroll: {
        flex: 1,
    },
    columnScrollContent: {
        paddingTop: ITEM_HEIGHT,
        paddingBottom: ITEM_HEIGHT,
    },
    selectionBand: {
        position: 'absolute',
        top: ITEM_HEIGHT,      // vertically centred in the 3-row column
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        backgroundColor: colors.muted,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.primaryLight,
        borderRadius: radii.radiusSm,
    },
    columnDivider: {
        width: spacing.sm,
    },
    item: {
        height: ITEM_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        fontWeight: fontWeight.regular,
    },
    itemTextSelected: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    itemTextMuted: {
        color: colors.gray,
        opacity: 0.45,
    },
    confirmButton: {
        marginTop: spacing.xs,
    },
});
