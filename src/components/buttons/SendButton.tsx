import { Show } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import { DeleteIcon, SendIcon } from '../icons';

type SendButtonProps = {
  sendButtonColor?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  disableIcon?: boolean;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export const SendButton = (props: SendButtonProps) => {
  return (
    <button
      type="submit"
      disabled={props.isDisabled || props.isLoading}
      {...props}
      class={
        'py-[12px] px-[32px] justify-center font-semibold text-white outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 chatbot-button ' +
        props.class
      }
      style={{
        'border-radius': '100px',
        background: '#001E50',
      }}
    >
      <Show when={!props.isLoading} fallback={<Spinner class="text-white" />}>
        Submit
      </Show>
    </button>
  );
};
export const DeleteButton = (props: SendButtonProps) => {
  // Check if <flowise-fullchatbot> is present in the DOM
  const isFullChatbot = document.querySelector('flowise-fullchatbot') !== null;
  const paddingClass = isFullChatbot ? 'px-4' : 'px-12';

  return (
    <button
      type="submit"
      disabled={props.isDisabled || props.isLoading}
      {...props}
      class={
        `py-2 ${paddingClass} justify-center font-semibold focus:outline-none flex items-center 
        disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all 
        filter hover:brightness-90 active:brightness-75 chatbot-button 
        text-[11px] md:text-[16px] md:mr-[50px]
        ` + props.class
      }
      style={{
        background: 'white',
        border: '1px solid #001E50',
        color: '#000E26',
        'font-size': '16px',
        'border-radius': '48px',
        'font-weight': '400',
      }}
      title="Reset Chat"
    >
      <Show when={!props.isLoading} fallback={<Spinner class="text-white" />}>
        Start New Chat
      </Show>
    </button>
  );
};

export const Spinner = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg
    {...props}
    class={'animate-spin -ml-1 mr-3 h-5 w-5 ' + props.class}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    data-testid="loading-spinner"
  >
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
