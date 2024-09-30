import { JSX } from 'solid-js/jsx-runtime';
import { XIcon } from '../icons';

type CancelButtonProps = {
  buttonColor?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  disableIcon?: boolean;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export const CancelButton = (props: CancelButtonProps) => {
  return (
    <button
      type="submit"
      disabled={props.isDisabled || props.isLoading}
      {...props}
      class={
        'w-[56px] h-14 ml-[8px] justify-center font-semibold focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 chatbot-button ' +
        props.class
      }
      style={{
        background: '#001E50',
        border: 'none',
        'border-radius': '100%',
      }}
    >
      <XIcon color={'#FFFFFF'} />
    </button>
  );
};
