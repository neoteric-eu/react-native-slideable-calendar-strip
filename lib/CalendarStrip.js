import React, { Component, PureComponent } from 'react';
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
import Weeks from './Weeks';
import {
  format,
  eachDay,
  isFuture,
  isSameDay,
  endOfWeek,
  startOfWeek,
  differenceInDays,
  isBefore,
  startOfDay,
  addWeeks,
  isSameWeek,
  addDays
} from 'date-fns';
import {normalize} from './normalize'
import {isEqual} from 'lodash';
import {formatToTimeZone} from 'date-fns-timezone';
import {isIphoneX} from 'react-native-iphone-x-helper';

const width = Dimensions.get('window').width;
const ITEM_LENGTH = width / 7;
export const THIS_WEEK = 'THIS WEEK';

const dateToUtc = (date = new Date()) => formatToTimeZone(date, '', {timeZone: 'UTC'});

class DateItem extends PureComponent {
  render() {
    const {emptyDays, item, highlight, onItemPress} = this.props;
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
  }
}

class CalendarStrip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datas: this.getInitialDates(),
      header: THIS_WEEK,
      pageOfToday: 0,
      currentPage: 0
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
        || !isEqual(nextState.datas, this.state.datas)
        || !isEqual(nextState.header, this.state.header);
  }

  componentWillReceiveProps(nextProps) {
    const nextSelectedDate = nextProps.selectedDate;
    let nextPage;
    if (!this.currentPageDatesIncludes(nextSelectedDate)) {
      const sameDay = (d) => isSameDay(d, nextSelectedDate);
      if (this.state.datas.find(sameDay)) {
        let selectedIndex = this.state.datas.findIndex(sameDay);
        if (selectedIndex === -1) selectedIndex = this.state.pageOfToday;
        nextPage = ~~(selectedIndex / 7);
      } else {
        if (isFuture(nextSelectedDate)) {
          const tail = endOfWeek(addWeeks(dateToUtc(), 6));
          const days = eachDay(startOfWeek(dateToUtc()), tail);
          this.setState({
            datas: days
          }, () => {
            nextPage = ~~(days.length/7 - 1);
          });
        } else {
          const tail = endOfWeek(addWeeks(dateToUtc(), 6));
          const days = eachDay(startOfWeek(dateToUtc()), tail);
          this.setState({
            datas: days
          }, () => {
            nextPage = 0;
          });
        }
      }
      if (isSameDay(nextProps.selectedDate, this.props.selectedDate)) return;
      this.scrollToPage(nextPage);
    }
  }

  scrollToPage = (page, animated=true) => {
    this._calendar.scrollToIndex({ animated, index: 7 * page });
  }

  currentPageDatesIncludes = (date) => {
    const { currentPage } = this.state;
    const currentPageDates = this.state.datas.slice(7*currentPage, 7*(currentPage+1));
    return !!currentPageDates.find(d => isSameDay(d, date));
  }

  getInitialDates() {
    const dateUTC = dateToUtc();
    const next6WeekFromToday = endOfWeek(addDays(dateUTC, 60));
    const eachDays = eachDay(startOfWeek(dateUTC), next6WeekFromToday);
    return eachDays;
  }

  handleViewableItemsChanged = ({viewableItems}) => {
    const lastItemDate = viewableItems[viewableItems.length - 1].item;
    let header;
    if (isSameWeek(lastItemDate, dateToUtc(), {weekStartsOn: 0})) {
      header = THIS_WEEK
    } else {
      const start = format(startOfWeek(lastItemDate), 'MMM DD');
      header = `${start} - ${format(endOfWeek(lastItemDate), 'MMM DD')}`
    }
    this.setState({header}, () => {
      if (!isSameWeek(this.props.selectedDate, lastItemDate), {weekStartsOn: 0}) {
        this.props.onWeekChanged(lastItemDate)
      }
    });

  }

  get _statusBarHeight() {
    return isIphoneX() ? 30 : 21;
  }

  _renderHeader = () => {
    const {filtersActive} = this.props;
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
          <TouchableOpacity
              style={styles.button}
              onPress={this.props.onFilterPress}>
            <View style={styles.buttonWrapper}>
              <Animated.Image style={[styles.buttonAbsolute, {
                opacity: animateOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0]
                })
              }]} source={!filtersActive ? require('../assets/icon_filter.png') : require('../assets/icon_filter_active.png')}/>
            </View>
          </TouchableOpacity>
          <View
              style={styles.headerWrapper}
              pointerEvents={'none'}>
            <Text
                style={styles.headerDate}>
              {this.state.header}</Text>
          </View>
        </View>
    );
  };

  _renderBG= () => {
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

  _stringToDate = (dateString) => {
    const dateArr = dateString.split('-');
    const [y, m, d] = dateArr.map(ds => parseInt(ds, 10));
    return dateToUtc(new Date(y, m-1, d));
  };

  render() {
    const {header} = this.state;
    const {
      emptyDays,
      markedDate,
      onPressDate,
      selectedDate
    } = this.props;
    const marked = markedDate.map(ds => this._stringToDate(ds));
    return (
        <Animated.View
            style={[styles.container, {
              transform: [{
                translateY: this.props.animateValue.interpolate({
                  inputRange: [normalize(300 - this._statusBarHeight), normalize(300)],
                  outputRange: [normalize(0), normalize(this._statusBarHeight)],
                  extrapolate: 'clamp'
                })
              }]
            }]}
            {...this._panResponder.panHandlers}>
          {this._renderBG()}
          {this._renderHeader()}
          <Weeks header={header} selectedDate={selectedDate}/>
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
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) =>
                  <DateItem
                      item={item}
                      emptyDays={emptyDays}
                      onItemPress={() => onPressDate(item)}
                      highlight={isSameDay(selectedDate, item)}
                      marked={marked.find(d => isSameDay(d, item))}
                  />
              }
          />
        </Animated.View>
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
  onPressGoToday: PropTypes.func,
  markedDate: PropTypes.array,
  onSwipeDown: PropTypes.func,
  onWeekChanged: PropTypes.func,
  showWeekNumber: PropTypes.bool,
  filtersActive: PropTypes.bool,
  backgroundOffset: PropTypes.number
};

CalendarStrip.defaultProps = {
  emptyDays: [],
  showWeekNumber: false,
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
