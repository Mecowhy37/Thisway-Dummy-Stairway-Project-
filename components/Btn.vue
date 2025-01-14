<template>
    <button
        class="btn"
        ref="btn"
        :disabled="props.disabled"
        :class="[
            {
                'btn--primary': !props.plain && !props.opaque && !props.transparent,
                'btn--plain': props.plain,
                'btn--opaque': props.opaque,
                'btn--active': props.active,
                'btn--solid-disabled': props.solidDisabled,
                'btn--selectable': props.selectable,
                'btn--transparent': props.transparent,
                'btn--grey': props.grey,
                'btn--tiny': props.tiny,
                'btn--radio': props.radio,
                'btn--small': props.small,
                'btn--compact': props.compact,
                'btn--sm-radius': props.smRadius,
                'btn--bulky': props.bulky,
                'btn--custom': props.custom,
                'btn--wide': props.wide,
                'btn--circle': props.circle,
                'btn--unclickable': props.loading,
                'btn--w-icon': slots.icon && slots.default,
                'btn--icon': slots.icon && !slots.default,
                'btn--reverse': props.reverse,
            },
        ]"
    >
        <component
            v-if="slots.default"
            :is="props.is"
            class="slot"
            id="default-slot"
        >
            <slot name="default"></slot>
        </component>
        <div
            v-if="slots.icon"
            class="slot"
            id="icon-slot"
            :class="{ contrast: props.iconContrast }"
        >
            <slot name="icon"></slot>
        </div>
        <span
            v-if="loading"
            class="loader"
        ></span>
    </button>
</template>

<script setup lang="ts">
import { useSlots } from "vue"
import { useStepStore } from "@/stores/step"

const stepStore = useStepStore()

export interface Props {
    is?: string
    tiny?: boolean
    radio?: boolean
    small?: boolean
    compact?: boolean
    smRadius?: boolean
    bulky?: boolean
    custom?: boolean
    wide?: boolean
    grey?: boolean
    transparent?: boolean
    plain?: boolean
    opaque?: boolean
    active?: boolean
    selectable?: boolean
    circle?: boolean
    disabled?: boolean
    solidDisabled?: boolean
    loading?: boolean
    iconContrast?: boolean
    reverse?: boolean
    rotate?: number
}

const props = withDefaults(defineProps<Props>(), {
    is: "p",
    rotate: 0,
})

const slots = useSlots()

const rotateDeg = computed(() => {
    return props.rotate + "deg"
})
</script>

<style lang="scss">
$vert-padd: 13px;
$horiz-padd: 16px;
/* $vert-padd: 0.6rem;
$horiz-padd: 1.3rem; */
.btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--inner-wdg-radius);
    border: 1px solid transparent;
    padding: $vert-padd $horiz-padd;
    color: var(--text-color);
    white-space: nowrap;
    background-color: var(--primary);
    box-shadow: var(--button-box-shadow);
    transform: rotate(v-bind(rotateDeg));
    cursor: pointer;
    * {
        pointer-events: none;
    }

    &:disabled {
        background-color: var(--grey-opaque);
        color: var(--text-grey);
    }

    #default-slot {
        position: relative;
        line-height: 100%;
    }

    &--primary {
        &:not(:disabled):hover {
            background: linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), var(--primary);
            border: 1px solid rgba(255, 255, 255, 0.4);
        }
        &:not(:disabled):active {
            background: linear-gradient(0deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), var(--primary);
            border: 1px solid #ffffff;
        }
    }
    &--grey {
        background-color: var(--grey-light);
        &:not(:disabled):hover {
            background: linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), var(--grey-light);
            border: 1px solid rgba(255, 255, 255, 0.4);
        }
        &:not(:disabled):active {
            background: linear-gradient(0deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), var(--grey-light);
            border: 1px solid #ffffff;
        }
    }

    // SIZES ------------
    &--tiny {
        padding: 0;
    }
    &--radio {
        border-radius: var(--small-wdg-radius);
        padding: 8px 10px;
        @media (max-width: 447px) {
            padding: 5px;
        }
    }
    &--small {
        padding: 5px 10px;
    }
    &--compact {
        padding: 7px 15px;
    }
    &--sm-radius {
        border-radius: var(--small-wdg-radius);
    }
    &--bulky {
        $height: 3rem;
        height: $height;
        border-radius: var(--inner-wdg-radius);
    }
    &--custom {
        border-radius: var(--small-wdg-radius);
        padding: 13px 15px;
    }
    &--wide {
        width: 100%;
    }
    // SIZES ------------

    &--w-icon {
        gap: 0.2rem;
        #icon-slot {
            margin-right: -0.2rem;
            margin-left: 0.3rem;
        }
    }
    &--plain {
        border: none;
        background-color: var(--widget-bg);
        * {
            color: var(--text-color-reverse);
        }
    }
    &--opaque {
        border: none;
        background-color: var(--btn-opaque-bg);
        * {
            color: var(--text-color-reverse);
        }
        &:disabled {
            background-color: var(--selectors-disabled-bg);
            * {
                color: var(--selectors-disabled-color);
            }
        }
    }
    &--active {
        &:not(:disabled) {
            &:hover {
                background: var(--btn-opaque-hover-bg) !important;
            }
            &:active {
                background: var(--btn-opaque-active-bg) !important;
            }
        }
    }

    &--selectable {
        border: 1px solid transparent;

        &:not(:disabled) {
            //not selected
            &:hover {
                border: 1px solid var(--primary);
            }
            &:active {
                background: var(--btn-selectable-unchecked-active-bg);
            }

            &.selected {
                border: 1px solid var(--primary);
                background: var(--btn-selectable-checked-bg);

                &:hover {
                    border: 1px solid white;
                }

                &:active {
                    border: 1px solid white;
                    background: var(--btn-selectable-checked-active-bg);
                }
            }
        }
    }

    &--transparent {
        background-color: transparent;
        box-shadow: none;
        &:hover {
            background-color: var(--trans-hover);
        }
    }
    &--circle {
        border: none;
        border-radius: 9999px;
        padding: 0px;
        #icon-slot {
            .icon {
                margin: 3px;
            }
        }
    }
    &--unclickable {
        pointer-events: none;
    }
    &--reverse {
        flex-direction: row-reverse;
        #icon-slot {
            margin-left: -0.3rem !important;
            margin-right: 0.3rem !important;
        }
    }
}

.loader {
    margin-left: 0.5rem;
    height: 25px;
    aspect-ratio: 1/1;
    border: 5px dotted #fff;
    border-radius: 50%;
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    animation: rotation 2s linear infinite;
}

@keyframes rotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
