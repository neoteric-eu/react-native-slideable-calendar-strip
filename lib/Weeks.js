import React from 'react';
import {Text, View} from 'react-native';
import styles from './styles';

const WEEK_en = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const Weeks = ({isCurrentWeek, selectedDate}) => {
    const selectedDay = new Date(selectedDate).getDay();

    const renderItem = (day, index) => {
        const isActive = selectedDay === index && isCurrentWeek;
        return <View
            style={styles.weekItem}
            key={day + Math.random()}>
            <Text style={[styles.weekText, isActive && styles.weekTextActive]}>
                {day}
            </Text>
        </View>
    };

    return (
        <View
            style={styles.weeksWrapper}
            pointerEvents={'none'}>
            {WEEK_en.map(renderItem)}
        </View>
    );
};

export default Weeks;
