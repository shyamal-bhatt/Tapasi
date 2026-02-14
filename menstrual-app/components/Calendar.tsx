import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';

interface CalendarProps {
    currentDate: Date;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    onMonthChange: (date: Date) => void;
    periodDates: string[];
    activityDates: string[];
}

export function Calendar({
    currentDate,
    selectedDate,
    onDateSelect,
    onMonthChange,
    periodDates,
    activityDates
}: CalendarProps) {

    const markedDates = useMemo(() => {
        const marks: any = {};
        const sortedPeriodDates = [...periodDates].sort();

        // Period dates (Connected Pill)
        sortedPeriodDates.forEach((date, index) => {
            const prevDate = sortedPeriodDates[index - 1];
            const nextDate = sortedPeriodDates[index + 1];

            const isStart = !prevDate || new Date(date).getTime() - new Date(prevDate).getTime() > 86400000 * 1.5; // Gap > 1 day
            const isEnd = !nextDate || new Date(nextDate).getTime() - new Date(date).getTime() > 86400000 * 1.5;

            marks[date] = {
                startingDay: isStart,
                endingDay: isEnd,
                color: '#ffe4e6',
                textColor: '#be123c'
            };
        });

        // Activity dates (Blue Dot)
        activityDates.forEach(date => {
            if (!marks[date]) {
                marks[date] = {};
            }
            marks[date] = {
                ...marks[date],
                marked: true,
                dotColor: '#3b82f6'
            };
        });

        // Selected date
        const selectedKey = format(selectedDate, 'yyyy-MM-dd');
        if (!marks[selectedKey]) {
            marks[selectedKey] = {};
        }

        // For 'period' marking, we must use 'color' and 'textColor' directly
        // to ensure the background and text are visible.
        // We force startingDay and endingDay to true to give it rounded edges (pill shape)
        // as requested ("lightgrey box... have curved edges").
        marks[selectedKey] = {
            ...marks[selectedKey],
            color: '#e5e7eb', // gray-200
            textColor: '#1f2937', // gray-800
            startingDay: true,
            endingDay: true,
        };

        return marks;
    }, [periodDates, activityDates, selectedDate]);

    return (
        <View style={styles.container}>
            <RNCalendar
                current={format(currentDate, 'yyyy-MM-dd')}
                onDayPress={(day: DateData) => {
                    const date = new Date(day.dateString + 'T00:00:00');
                    onDateSelect(date);
                    console.log('[Calendar] Selected date:', day.dateString);
                }}
                onMonthChange={(month: DateData) => {
                    const date = new Date(month.dateString + 'T00:00:00');
                    onMonthChange(date);
                    console.log('[Calendar] Changing month to:', month.dateString);
                }}
                markingType={'period'}
                markedDates={markedDates}
                enableSwipeMonths={true}
                theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayBackgroundColor: '#00adf5',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#F43F5E',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    arrowColor: '#F43F5E',
                    monthTextColor: '#1f2937',
                    indicatorColor: 'blue',
                    textDayFontFamily: 'NunitoSans_400Regular',
                    textMonthFontFamily: 'NunitoSans_700Bold',
                    textDayHeaderFontFamily: 'NunitoSans_600SemiBold',
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
});
