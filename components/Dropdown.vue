<template>
    <div
        class="dropdown"
        ref="toActivate"
    >
        <div
            class="dropdown__activator"
            ref="openner"
            @click="toggleDropdown()"
        >
            <slot
                name="dropdown-activator"
                :on="isDropdownActive"
            ></slot>
        </div>

        <div
            v-show="isDropdownActive"
            class="dropdown__box base-box"
            :class="[
                {
                    'no-padding': props.noPadding,
                    'base-box--solid': props.solid,
                    burger: props.burger,
                    'to-right': props.toRight,
                },
            ]"
        >
            <slot
                name="dropdown"
                :toggle-dropdown="toggleDropdown"
            ></slot>
        </div>
    </div>
</template>

<script setup>
import { onClickOutside } from "@vueuse/core"

const props = defineProps({
    settingsRef: Object,
    toRight: Boolean,
    burger: Boolean,
    noPadding: Boolean,
    solid: Boolean,
    width: {
        type: Number,
        default: 250,
    },
})

const toActivate = ref(null)
const openner = ref(null)
const isDropdownActive = ref(false)
function toggleDropdown() {
    if (props.settingsRef) {
        if (!props.settingsRef.isValidSettings) {
            let isDeadlineValid
            let isSlippageValid
            if (!props.settingsRef.noSlippage) {
                const slippage = props.settingsRef.slippage
                isSlippageValid = props.settingsRef.validateSlippage(slippage, true)
            }
            const deadline = props.settingsRef.deadline
            isDeadlineValid = props.settingsRef.validateDeadline(deadline, true)

            if (isSlippageValid === false || isDeadlineValid === false) {
                return
            }
        }
    }
    isDropdownActive.value = !isDropdownActive.value
}
onClickOutside(toActivate, (event) => {
    if (isDropdownActive.value === true) {
        toggleDropdown()
        // event.stopPropagation()
        // if (openner.value === event.target.parentNode) {
        // when is open and actcivator is clicked
        // event.stopPropagation()
        // }
    }
})

const boxWidth = computed(() => {
    return props.width + "px"
})
</script>

<style scoped lang="scss">
.dropdown {
    display: flex;
    position: relative;

    &__activator {
        display: flex;
    }
    &__box {
        position: absolute;
        right: 0%;
        z-index: 150;
        top: 100%;
        margin-top: 0.8rem;
        width: v-bind(boxWidth);
        border-radius: var(--semi-wdg-radius);
        padding: 0.5rem;
        border: 1px solid var(--grey-stroke-sm);
        box-shadow: var(--modal-box-shadow);
        &.no-padding {
            padding: 0;
        }
        &.to-right {
            left: 0%;
        }
        &.burger {
            margin-left: 10px;
        }
    }
}
</style>
