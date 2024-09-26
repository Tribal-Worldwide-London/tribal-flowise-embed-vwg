type Props = {
  prompt: string;
  onPromptClick?: () => void;
  starterPromptFontSize?: number;
};
export const StarterPromptBubble = (props: Props) => (
  <>
    <div
      data-modal-target="defaultModal"
      data-modal-toggle="defaultModal"
      class="p-[24px] pt-[32px] animate-fade-in host-container hover:brightness-90 active:brightness-75 relative "
      onClick={() => props.onPromptClick?.()}
      style={{
        display: 'flex',
        'font-family': 'vw-text',
        'font-size': '16px',
        'font-weight': '400',
        'line-height': '150%',
        'border-radius': '16px',
        cursor: 'pointer',
        'background-color': '#00B0F0',
        color: 'white',
        'box-shadow': '0px 8px 32px 0px rgba(0, 0, 0, 0.10)',
        'align-items': 'center',
        'text-align': 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <svg width="46" height="59" viewBox="0 0 46 59" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g id="Lightning">
            <path
              id="Path"
              d="M43.2016 23.016C43.2024 22.9405 43.2028 22.8649 43.2028 22.7893C43.2028 11.3267 33.9981 2 22.6014 2C11.2047 2 2 11.3267 2 22.7893V22.7966L2.00005 22.8038L2.00143 22.9928C2.00048 23.0879 2 23.1832 2 23.2787C2 27.337 3.52862 31.9731 6.32446 37.1131C9.13364 42.2776 13.3072 48.1046 18.7997 54.5853L18.8043 54.5906L19.1869 55.0389L19.2055 55.0607L19.2247 55.082C20.1176 56.0692 21.3512 56.5796 22.59 56.583C23.6531 56.586 24.7239 56.2158 25.5877 55.4647L25.5877 55.4646C25.7597 55.3151 25.9202 55.1529 26.068 54.9795C31.6709 48.4055 35.9276 42.4995 38.7926 37.2702C41.6436 32.0663 43.2028 27.3774 43.2028 23.2787C43.2028 23.191 43.2024 23.1034 43.2016 23.016Z"
              fill="#001E50"
              stroke="#F3F4F5"
              stroke-width="4"
            />
            <path
              id="Path_2"
              d="M17.8157 26.2849L21.6478 27.7347L18.7738 36.9942C18.6574 37.2345 18.756 37.5244 18.9941 37.6418C19.2322 37.7593 19.5196 37.6597 19.636 37.4195L27.894 26.1883C28.1089 25.8934 28.1733 25.5135 28.0677 25.1633C27.9621 24.8132 27.6988 24.5339 27.3575 24.4098L23.2764 22.8633L25.6714 13.4105C25.7156 13.1824 25.5989 12.9535 25.3894 12.8569C25.1798 12.7604 24.9319 12.8215 24.79 13.0046L17.2409 24.6031C17.0722 24.8987 17.0386 25.2536 17.1488 25.5761C17.259 25.8986 17.5023 26.1571 17.8157 26.2849Z"
              fill="white"
            />
          </g>
        </svg>
      </div>

      {props.prompt}
    </div>
  </>
);
