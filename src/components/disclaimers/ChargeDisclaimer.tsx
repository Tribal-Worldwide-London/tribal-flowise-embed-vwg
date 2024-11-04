
export const ChargeDisclaimer = () => (
    <div class="text-sm px-[24px] py-[4px]">
        <details>
            <summary>Note: This response includes a disclaimer about estimated charging times. Tap here for details.</summary>
            <p class="pt-[4px]">
                Charging times will vary depending on various factors, including the selected vehicle, standard specification, the options you
                choose, the type of charger used, the level of charge in the battery, the age type, condition and temperature of the charger and
                the battery, the power supply, ambient temperature at the point of use and other environmental factors.
                <br />
                <br />
                Charging time will be longer in cold weather. Charging times will also be affected by the charging curve (for example, once
                charging passes 80%, charging will slow to protect the battery's longevity) and will be longer if battery temperature activates
                safeguarding technology. Figures are subject to change due to ongoing approvals. The availability of 150kWh and 350kWh chargers
                is currently limited in the UK. They are mainly located on selected motorways and major arterial routes. These chargers are not
                currently available in Northern Ireland and numbers are extremely low in Scotland, Wales, and parts of England. Please see EV
                Route Planner for charging points available in the UK:
                <a href="https://www.volkswagen.co.uk/en/electric-and-hybrid/living-electric/lifestyle/ev-route-planner.html" target="_blank">
                    {' '}
                    https://www.volkswagen.co.uk/en/electric-and-hybrid/living-electric/lifestyle/ev-route-planner.html
                </a>
            </p>
        </details>
    </div>
)


export default ChargeDisclaimer