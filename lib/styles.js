import {Dimensions, StyleSheet} from 'react-native';
import {normalize} from 'react-native-slideable-calendar-strip/lib/normalize';

const width = Dimensions.get('window').width;

const styles = StyleSheet.create({
    container: {
        width,
        backgroundColor: 'black',
        paddingBottom: normalize(24)
    },
    backgroundWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#000'
    },
    button: {
        marginVertical: normalize(6),
        width: normalize(44),
        height: normalize(44),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 'auto'
    },
    buttonWrapper: {
        width: normalize(24),
        height: normalize(24),
    },
    buttonAbsolute: {
        width: normalize(24),
        height: normalize(24),
        position: 'absolute',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerWrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: '20%'
    },
    headerCaret: {
        height: normalize(19),
        bottom: normalize(4.5),
        marginLeft: normalize(6)
    },
    headerTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerDate: {
        color: 'white',
        fontSize: normalize(18),
        textTransform: 'uppercase',
        lineHeight: normalize(19),
        fontFamily: 'FlamaCondensed-Semibold',
        marginHorizontal: 'auto',
        letterSpacing: normalize(0.5)
    },
    itemContainer: {
        width: width / 7,
        height: normalize(58)
    },
    itemWrapButton: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    itemView: {
        justifyContent: 'center',
        alignItems: 'center',
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(36),
        borderWidth: 1,
        borderColor: 'transparent',
        color: 'white'
    },
    itemViewWrapper: {
        paddingTop: normalize(22)
    },
    itemDateText: {
        fontSize: 18,
        fontFamily: 'FlamaCondensed-Semibold'
    },
    weeksWrapper: {
        width,
        height: 22,
        flexDirection: 'row',
        marginBottom: normalize(-22)
    },
    weekItem: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    weekText: {
        fontFamily: 'FlamaCondensed-Semibold',
        fontSize: 15,
        color: 'white'
    },
    weekTextActive: {
        color: '#FF5D03'
    }
});

export default styles;
