import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  Animated
} from 'react-native';
import ActionSheet from 'react-native-actionsheet';
import Weeks from './Weeks';
import {
  format,
  eachDay,
  isSameDay,
  endOfWeek,
  startOfWeek,
  differenceInDays,
  isBefore,
  startOfDay,
  isSameWeek,
  addDays,
} from 'date-fns';
import {normalize} from './normalize'
import {isEqual} from 'lodash';
import {formatToTimeZone} from 'date-fns-timezone';
import {isIphoneX} from 'react-native-iphone-x-helper';
import Arrow from '../assets/ArrowDown.svg';

const width = Dimensions.get('window').width;
const ITEM_LENGTH = width / 7;
export const THIS_WEEK = 'THIS WEEK';

const dateToUtc = (date = new Date()) => formatToTimeZone(date, '', {timeZone: 'UTC'});

const DateItem = ({emptyDays, item, highlight, onItemPress}) => {
  const isPast = isBefore(item, startOfDay(dateToUtc()));
  const isEmpty = emptyDays.find(date => isSameDay(item, date));
  const isDisabled = !!isPast || !!isEmpty;
  const day = format(item, 'D');
  const highlightBgColor = '#FF5D03';
  const normalBgColor = 'transparent';
  const textColor = highlight ? '#FF5D03' : !isDisabled ? 'white' : '#585858';

  return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
            underlayColor='#008b8b'
            style={styles.itemWrapButton}
            onPress={onItemPress}
            disabled={isDisabled}
        >
          <View style={styles.itemViewWrapper}>
            <View style={[
              styles.itemView,
              {borderColor: highlight ? highlightBgColor : normalBgColor}
            ]}>
              <Text style={[
                styles.itemDateText,
                {color: textColor}
              ]}>{day}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
  );
};

class CalendarStrip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datas: this.getInitialDates(),
      header: THIS_WEEK,
      pageOfToday: 0,
      currentPage: 0,
      currentDropdownValue: this.props.currentDropdownValue,
      isCurrentWeek: true
    };
  }

  componentWillMount() {
    const touchThreshold = 50;
    const speedThreshold = 0.2;
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dy, vy } = gestureState;
        if (dy > touchThreshold && vy > speedThreshold) {
          const { onSwipeDown } = this.props;
          onSwipeDown && onSwipeDown();
        }
        return false;
      }
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !isSameDay(nextProps.selectedDate, this.props.selectedDate)
        || !isEqual(nextProps.emptyDays, this.props.emptyDays)
        || !isEqual(nextProps.filtersActive, this.props.filtersActive)
        || !isEqual(nextProps.backgroundOffset, this.props.backgroundOffset)
        || !isEqual(nextProps.currentDropdownValue, this.props.currentDropdownValue)
        || !isEqual(nextProps.animateValue, this.props.animateValue)
        || !isEqual(nextProps.isFiltersAvailable, this.props.isFiltersAvailable)
        || !isEqual(nextState.datas, this.state.datas)
        || !isEqual(nextState.header, this.state.header)
        || !isEqual(nextState.currentDropdownValue, this.state.currentDropdownValue)
        || !isEqual(nextState.isCurrentWeek, this.state.isCurrentWeek)
        || !isEqual(nextState.currentPage, this.state.currentPage);
  }

  componentWillReceiveProps(nextProps) {
    const nextSelectedDate = nextProps.selectedDate;
    if (!isSameDay(nextProps.selectedDate, this.props.selectedDate)) {
      this.handleDateChange(nextSelectedDate)
    }
    if (this.props.currentDropdownValue !== nextProps.currentDropdownValue) {
      this.setState({
        currentDropdownValue: nextProps.currentDropdownValue
      });
    }
  }

  handleDateChange = (nextSelectedDate) => {
    const index = this.state.datas.findIndex(day => isSameDay(day, nextSelectedDate));

    if (index === -1) {
      return;
    }

    const found = this.state.datas[index];
    const currentPage = Math.floor(index / 7);
    const end = endOfWeek(found);

    this.setState({
      isCurrentWeek: isSameWeek(nextSelectedDate, end)
    });

    if (this.state.currentPage !== currentPage) {
      this.scrollToPage(currentPage);
      this.setState({
        currentPage,
      });
    }
  };

  scrollToPage = (currentPage, animated = true) => {
    const newIndex = 7 * currentPage;
    if (newIndex >= this.state.datas.length) {
      return;
    }
    this._calendar.scrollToIndex({animated, index: newIndex});
  };

  getInitialDates() {
    const dateUTC = dateToUtc();
    const next30DaysFromToday = endOfWeek(addDays(dateUTC, 30));
    const eachDays = eachDay(startOfWeek(dateUTC), next30DaysFromToday);
    return eachDays;
  }

  handleViewableItemsChanged = ({viewableItems}) => {
    if (!viewableItems[1]) {
      return;
    }

    const viewableItemDate = viewableItems[1].item;
    const end = endOfWeek(viewableItemDate);
    this.setState({
      header: this.setHeader(viewableItemDate),
      isCurrentWeek: isSameWeek(this.props.selectedDate, end)
    });
  };

  setHeader = (date) => {
    let header;
    if (isSameWeek(date, dateToUtc())) {
      header = THIS_WEEK
    } else {
      const start = format(startOfWeek(date), 'MMM DD');
      header = `${start} - ${format(endOfWeek(date), 'MMM DD')}`
    }
    return header;
  };

  openDropdown = () => this.ActionSheet && this.ActionSheet.show();

  handleDropdownSelection = (buttonIndex) => this.props.onDropdownValueChange(
    this.props.dropdownValues[buttonIndex]
  );

  get _statusBarHeight() {
    return isIphoneX() ? 30 : 21;
  }

  _renderHeader = () => {
    const {currentDropdownValue} = this.state;
    const {filtersActive, isFiltersAvailable} = this.props;
    const animateOpacity = new Animated.Value(0);
    Animated.timing(
        animateOpacity, {
          toValue: this.props.isButtonActive ? 1 : 0,
          duration: this.props.isButtonActive ? 35 : 220,
          useNativeDriver: true
        }
    ).start();
    return (
        <View style={styles.header}>
          <View style={styles.button} pointerEvents={isFiltersAvailable ? 'auto' : 'none'}>
            <TouchableOpacity
                onPress={this.props.onFilterPress}>
              {isFiltersAvailable &&
              <View style={styles.buttonWrapper}>
                <Animated.Image style={[styles.buttonAbsolute, {
                  opacity: animateOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0]
                  })
                }]} source={!filtersActive ? require('../assets/icon_filter.png') : require('../assets/icon_filter_active.png')}/>
              </View>
              }
            </TouchableOpacity>
          </View>
          <View style={styles.headerWrapper}>
            <TouchableOpacity style={styles.headerTouchable} onPress={this.openDropdown}>
              <Text style={styles.headerDate}>
                {this.state.header} IN {currentDropdownValue.shortName}
              </Text>
              <View style={styles.headerCaret}>
                <Arrow/>
              </View>
            </TouchableOpacity>
          </View>
        </View>
    );
  };

  _renderBG = () => {
    const {animateValue, backgroundOffset} = this.props;
    const backgroundHeight = backgroundOffset || 300;
    return (
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: normalize(this._statusBarHeight * 2),
          backgroundColor: '#000',
          transform: [{
            translateY: animateValue.interpolate({
              inputRange: [normalize(backgroundHeight - this._statusBarHeight), normalize(backgroundHeight)],
              outputRange: [normalize(0), normalize(-this._statusBarHeight * 2)],
              extrapolate: 'clamp'
            })
          }]
        }} />
    );
  };

  _onItemPress = (item) =>
      () => this.props.onPressDate(item);

  _renderItem = ({item}) => {
    const {emptyDays, selectedDate} = this.props;
    return <DateItem
        item={item}
        emptyDays={emptyDays}
        onItemPress={this._onItemPress(item)}
        highlight={isSameDay(selectedDate, item)}
    />
  };

  _setActionSheetRef = (sheet) =>
      this.ActionSheet = sheet;

  _keyExtractor = (item, index) =>
      index.toString();

  render() {
    const {isCurrentWeek} = this.state;
    const {
      dropdownValues,
      selectedDate
    } = this.props;
    const options = [
      ...dropdownValues.map(({name}) => name),
      'Cancel',
    ];

    return (
        <React.Fragment>
          <ActionSheet
              ref={this._setActionSheetRef}
              title={'Select your Region'}
              options={options}
              cancelButtonIndex={options.length - 1}
              tintColor={'#000000'}
              onPress={this.handleDropdownSelection}
          />
          <Animated.View
              style={[styles.container, {
                transform: [{
                  translateY: this.props.animateValue.interpolate({
                    inputRange: [normalize(300 - this._statusBarHeight), normalize(300)],
                    outputRange: [normalize(0), normalize(this._statusBarHeight)],
                    extrapolate: 'clamp'
                  })
                }]
              }, {pointerEvents: 'box-none'}]}
              {...this._panResponder.panHandlers}>
            {this._renderBG()}
            {this._renderHeader()}
            <Weeks
                isCurrentWeek={isCurrentWeek}
                selectedDate={selectedDate}/>
            <FlatList
                ref={ref => this._calendar = ref}
                bounces={false}
                horizontal
                pagingEnabled
                initialScrollIndex={0}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={this.momentumEnd}
                scrollEventThrottle={500}
                getItemLayout={(data, index) => (
                    {length: ITEM_LENGTH, offset: ITEM_LENGTH * index, index}
                )}
                onViewableItemsChanged={this.handleViewableItemsChanged}
                data={this.state.datas}
                extraData={this.state}
                keyExtractor={this._keyExtractor}
                renderItem={this._renderItem}
            />
          </Animated.View>
        </React.Fragment>
    );
  }

  momentumEnd = (event) => {
    const dateUTC = dateToUtc();
    const firstDayInCalendar = this.state.datas ? this.state.datas[0] : dateUTC;
    const daysBeforeToday = differenceInDays(firstDayInCalendar, dateUTC);
    const pageOfToday = ~~(Math.abs(daysBeforeToday / 7));
    const screenWidth = event.nativeEvent.layoutMeasurement.width;
    const currentPage = event.nativeEvent.contentOffset.x / screenWidth;
    this.setState({
      pageOfToday,
      currentPage
    });
  }

}

CalendarStrip.propTypes = {
  emptyDays: PropTypes.array,
  selectedDate: PropTypes.object.isRequired,
  onPressDate: PropTypes.func,
  onSwipeDown: PropTypes.func,
  filtersActive: PropTypes.bool,
  backgroundOffset: PropTypes.number,
  isFiltersAvailable: PropTypes.bool
};

CalendarStrip.defaultProps = {
  emptyDays: [],
};

const styles = StyleSheet.create({
  container: {
    width,
    backgroundColor: 'black',
    paddingBottom: normalize(24)
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
  }
});

export default CalendarStrip;
