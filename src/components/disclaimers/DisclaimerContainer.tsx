import ChargeDisclaimer from './ChargeDisclaimer';
import RangeDisclaimer from './RangeDisclaimer';

type Props = {
  message: string;
};

export const DisclaimerContainer = (props: Props) => (
  <>
    {props.message.includes('command:charge-given') && <ChargeDisclaimer />}
    {props.message.includes('command:range-given') && <RangeDisclaimer />}
  </>
);

export default DisclaimerContainer;
