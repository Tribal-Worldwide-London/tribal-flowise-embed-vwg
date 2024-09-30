import { createSignal } from 'solid-js';

type FeedbackContentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  backgroundColor?: string;
  textColor?: string;
};

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#303235';

const FeedbackContentDialog = (props: FeedbackContentDialogProps) => {
  const [inputValue, setInputValue] = createSignal('');
  let inputRef: HTMLInputElement | HTMLTextAreaElement | undefined;

  const handleInput = (value: string) => setInputValue(value);

  const checkIfInputIsValid = () => inputValue() !== '' && inputRef?.reportValidity();

  const submit = () => {
    if (checkIfInputIsValid()) props.onSubmit(inputValue());
    setInputValue('');
  };

  const onClose = () => {
    props.onClose();
  };

  return (
    <>
      <div class="flex overflow-x-hidden overflow-y-auto fixed inset-0 z-[1002] outline-none focus:outline-none justify-center items-center">
        <div class="relative w-full my-6 max-w-3xl mx-4">
          <div
            class="border-0 rounded-[16px] shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none"
            style={{
              'background-color': props.backgroundColor ?? defaultBackgroundColor,
              color: props.textColor ?? defaultTextColor,
            }}
          >
            <div class="flex items-center justify-between p-[33px] pb-[24px] rounded-t-[16px]">
              <span
                class="whitespace-pre-wrap max-w-full text-[20px]"
                style={{
                  'font-weight': 300,
                  'font-family': 'vw-text',
                }}
              >
                Provide additional feedback
              </span>
              <button
                class="p-1 ml-auto bg-transparent border-0 text-black float-right text-xl leading-none font-semibold outline-none focus:outline-none"
                type="button"
                onClick={onClose}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19.5831 5.441L18.6411 4.5L12.056 11.1067L5.441 4.5L4.5 5.441L11.115 12.0477L4.51579 18.6215L5.45679 19.5625L12.056 12.9887L18.6427 19.5826L19.5847 18.6416L12.997 12.0477L19.5831 5.441Z"
                    fill="#001E50"
                  />
                </svg>
              </button>
            </div>
            <div class="relative p-[33px] pt-0 flex-auto">
              <textarea
                onInput={(e) => handleInput(e.currentTarget.value)}
                ref={inputRef as HTMLTextAreaElement}
                rows="4"
                class="block p-2.5 rounded-lg border focus:ring-blue-500 focus:border-blue-500 bg-transparent flex-1 w-full feedback-input disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 font-normal"
                style={{
                  border: '1px solid #eeeeee',
                  color: props.textColor ?? defaultTextColor,
                }}
                placeholder="What do you think of the response?"
                value={inputValue()}
              />
            </div>
            <div class="flex items-center justify-end p-[33px] pt-0 roundedb--[16px]">
              <button
                type="button"
                onClick={submit}
                {...props}
                class={
                  'py-[12px] px-[32px] justify-center font-semibold text-white outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 chatbot-button'
                }
                style={{
                  'border-radius': '100px',
                  background: '#001E50',
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="flex opacity-[60%] fixed inset-0 z-[1001] bg-black" />
    </>
  );
};

export default FeedbackContentDialog;
