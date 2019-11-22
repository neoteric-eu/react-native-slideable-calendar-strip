// this function will calculate proper value for all screen according to design
// design was made in 375x667dpi => iPhone 6
// we need to calculate it for all screens
import {Dimensions} from 'react-native';

const DP_WIDTH = 375;
const {width} = Dimensions.get('window');

export const normalize = (dp) => dp / DP_WIDTH * width;
