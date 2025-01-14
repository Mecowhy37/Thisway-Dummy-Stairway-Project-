<template>
    <div
        :key="id"
        class="notif base-box row"
        :class="[
            {
                'notif--approve': notifContent.state === 'approve',
                'notif--sign': notifContent.state === 'sign',
                'notif--pending': notifContent.state === 'pending',
                'notif--success': notifContent.state === 'success',
                'notif--error': notifContent.state === 'error',
            },
        ]"
    >
        <div
            class="notif__icon"
            :class="{ 'notif__icon--done': notifContent.isDone }"
        >
            <svg viewBox="0 0 100 100">
                <circle
                    class="circle-background"
                    cx="50"
                    cy="50"
                    r="42"
                ></circle>
                <circle
                    class="circle-progress"
                    :class="{ spinning: spinning }"
                    cx="50"
                    cy="50"
                    r="42"
                ></circle>
            </svg>
            <Transition>
                <Icon
                    key="tick"
                    v-show="notifContent.isDone && notifContent.state === 'success'"
                    class="notif__icon__symbol"
                    name="tick"
                    :size="9"
                ></Icon>
            </Transition>
            <Transition>
                <Icon
                    key="soloWarrning"
                    v-show="notifContent.isDone && notifContent.state === 'error'"
                    class="notif__icon__symbol"
                    name="soloWarrning"
                    :size="3"
                ></Icon>
            </Transition>
        </div>
        <div class="notif__content">
            <h4>{{ notifContent.header }}</h4>
            <template v-if="successData">
                <p class="caption">
                    Successfully {{ successData.action }}
                    <!-- quote -->
                    {{ roundFloor(successData.quote.amount) }} {{ successData.quote.token.symbol }}
                    <!---->
                    {{ successData.action === "swapped" ? "for" : "and" }}
                    <!-- base -->
                    {{ roundFloor(successData.base.amount) }} {{ successData.base.token.symbol }}
                </p>
            </template>
            <template v-else>
                <p class="caption">
                    {{ notifContent.paragraph }}
                </p>
            </template>
        </div>
        <div class="close">
            <Btn
                @click="deleteNotif(id)"
                circle
                transparent
                :class="{
                    'grey-text':
                        notifContent.state === 'approve' ||
                        notifContent.state === 'sign' ||
                        notifContent.state === 'pending',
                }"
            >
                <template #icon>
                    <Icon
                        name="cross"
                        :size="13"
                    />
                </template>
            </Btn>
        </div>
    </div>
</template>

<script setup>
import { formatUnits } from "ethers"
import { roundFloor } from "~/helpers/index"

const notificationContents = {
    approve: {
        state: "approve",
        header: "Click to change state",
        paragraph: "You'll go through transaction stages",
        isDone: false,
    },
    sign: {
        state: "sign",
        header: "Sign to complete the transaction",
        paragraph: "Sign to complete a transaction",
        isDone: false,
    },
    confirming: {
        state: "confirming",
        header: "Waiting for confirmation",
        paragraph: "Your signature is getting confirmed",
        isDone: false,
    },
    pending: {
        state: "pending",
        header: "Transaction mining",
        paragraph: "Your transaction is being processed",
        isDone: false,
    },
    success: {
        state: "success",
        header: "Transaction succeeded",
        paragraph: "Your transaction was successfully processed",
        isDone: true,
    },
    error: {
        state: "error",
        header: "Transaction failed",
        paragraph: "Your transaction was not completed",
        isDone: true,
    },
}
const props = defineProps({
    notif: Object,
    deleteNotif: Function,
})
const notifContent = computed(() => notificationContents[props.notif.state])

const id = computed(() => props.notif.id)
const successData = computed(() => {
    if (props.notif.successData) {
        const successDataProp = JSON.parse(JSON.stringify(props.notif.successData))
        successDataProp.quote.amount = formatUnits(
            successDataProp.quote.amount.toString(),
            successDataProp.quote.token.decimals
        )
        successDataProp.base.amount = formatUnits(
            successDataProp.base.amount.toString(),
            successDataProp.base.token.decimals
        )
        return successDataProp
    } else {
        return null
    }
})

const spinning = ref(true)
let timeoutId = null
watch(
    () => notifContent.value.isDone,
    (isDone) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        if (isDone) {
            timeoutId = setTimeout(() => {
                spinning.value = false
            }, 700)

            // if (!props.notif.keepNotification) {
            //     setTimeout(() => {
            //         props.deleteNotif(id.value)
            //     }, 5000)
            // }
        } else {
            spinning.value = true
        }
    },
    {
        immediate: true,
    }
)
</script>

<style lang="scss" scoped>
$color-transition: 0.4s 0.3s ease-out;
$transition: 0.4s ease-out;

.v-enter-active,
.v-leave-active {
    transition: opacity $color-transition;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}
.notif {
    $top-padd: 0.9rem;
    $side-padd: 1.3rem;
    margin-top: 5px;
    padding: $top-padd $side-padd;
    padding-right: 0;
    border-radius: var(--semi-wdg-radius);
    box-shadow: var(--modal-box-shadow);
    transition: $color-transition;

    &__content {
        flex-grow: 1;
        /* height: 48px; */
        &__transition {
            position: absolute;
        }
        h4 {
            margin-bottom: 7px;
        }
        p {
            margin-bottom: 4px;
        }
    }

    .close {
        margin-left: auto;
        margin-right: $top-padd;
        transition: color $color-transition;
        &.grey {
            color: var(--text-grey);
        }
    }

    &__icon {
        position: relative;
        height: 35px;
        width: 35px;
        align-self: center;
        flex-shrink: 0;
        margin-right: $side-padd;

        &__symbol {
            position: absolute;
            transform: translate(-50%, -50%);
            top: 50%;
            left: 51%;
        }
        .circle-background,
        .circle-progress {
            fill: none;
            stroke-width: 12;
        }
        .circle-background {
            stroke: var(--grey-stroke-sm);
        }
        .circle-progress {
            stroke: var(--primary);

            /* Adjusted for 67.5 degrees */
            stroke-dasharray: 46.864, 204.466;

            /* Adjusted for 120 degrees */
            /* stroke-dasharray: 83.77, 167.56; */

            stroke-dashoffset: -26.51;
            stroke-linecap: round;
            transform-origin: 50% 50%;
            transition: stroke-dasharray $transition, stroke $color-transition;
            &.spinning {
                animation: spin 1.5s linear infinite;
            }
            @keyframes spin {
                100% {
                    transform: rotate(360deg);
                }
            }
        }
        &--done {
            .circle-progress {
                stroke-dasharray: 251.33 0 !important;
            }
        }
    }
    &--approve {
    }
    &--sign {
        .circle-progress {
            /* Adjusted for 135 degrees */
            stroke-dasharray: 106.03 176.71;
        }
    }
    &--pending {
        .circle-progress {
            /* Adjusted for 202.5 degrees */
            stroke-dasharray: 140.74, 110.59;

            /* Adjusted for 240 degrees */
            /* stroke-dasharray: 167.55, 83.78;  */
        }
    }
    &--success {
        background-color: var(--primary);
        color: var(--text-color);
        .circle-progress {
            stroke: var(--text-color);
        }
        .close {
            color: var(--text-color);
        }
    }
    &--error {
        background-color: var(--error-color);
        .circle-progress {
            stroke: var(--text-color-reverse);
        }
        .close .btn {
            color: inherit;
        }
    }
}
</style>
