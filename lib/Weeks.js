import React from 'react';
import {
    View,
    Text,
    Dimensions
} from 'react-native';
import {normalize} from './normalize'
const width = Dimensions.get('window').width;
const WEEK_en = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export default ({isCurrentWeek, selectedDate}) => {
    return (
        <View
            style={{
                width,
                height: 22,
                flexDirection: 'row',
                marginBottom: normalize(-22)
            }}
            pointerEvents={'none'}>
            {WEEK_en.map((day, index) => {
                    const dayColor = selectedDate.getDay() === index && isCurrentWeek;
                    return <View
                        style={{
                            flex: 1,
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'flex-start'
                        }}
                        key={day + Math.random()}
                    >
                        <Text style={{
                            fontFamily: 'FlamaCondensed-Semibold',
                            fontSize: 15,
                            color: dayColor ? '#FF5D03' : 'white'
                        }}>{day}</Text>
                    </View>
                }
            )}
        </View>
    );
}
