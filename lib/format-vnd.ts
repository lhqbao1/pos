export const formattedNumber = (number: number) => {
  return number.toLocaleString('vi-VN') + ' VND'; // Vietnamese format: 200.000
};