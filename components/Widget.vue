<template>
    <div class="wrapper--widget">
        <main class="widget">
            <TopBar
                v-if="!noBar"
                :compact="props.compactBar"
                :router-direction="props.routerDirection"
            >
                <template #widget-title>
                    <slot name="widget-title"></slot>
                </template>
                <template #right-icon>
                    <slot name="right-icon"></slot>
                </template>
            </TopBar>
            <div class="widget__content">
                <slot name="widget-content"> </slot>
            </div>
        </main>
    </div>
</template>

<script setup>
const props = defineProps({
    compactBar: Boolean,
    routerDirection: String,
    noBar: Boolean,
})
</script>

<style lang="scss">
.widget {
    width: var(--widget-width);
    margin: auto var(--widget-sides);
    background-color: var(--widget-bg);
    color: var(--text-color-reverse);
    backdrop-filter: var(--backdrop-blur);
    border-radius: var(--outer-wdg-radius);
    box-shadow: var(--widget-box-shadow);

    @media (max-width: 475px) {
        width: calc(100% - var(--widget-sides) * 2);
    }
    @media (max-width: 354px) {
        width: var(--widget-min-width);
    }
    &__content {
        padding: 20px;
        display: grid;
        grid-auto-rows: auto;
        grid-gap: 20px;
    }
    .tips {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .windows {
        .window {
            display: flex;
            flex-direction: column;
            overflow: hidden;

            &__upper {
                flex-grow: 1;
                display: flex;
                align-items: center;
                position: relative;
                width: 100%;
                padding: 8px;
                input {
                    color: var(--text-color-reverse);
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border: none;
                    outline: none;
                    text-align: right;
                    font-size: 2rem;
                    padding-left: 8px;

                    &.error {
                        color: var(--error-color);
                    }

                    &::placeholder {
                        color: var(--text-grey);
                    }
                }
            }
            &__lower {
                height: 25px;
                gap: 5px;
                padding: 5px 8px;
                text-align: end;
                background-color: var(--swap-windows);
                color: var(--text-grey);
                &:not(.disabled) {
                    /* color: var(--primary); */
                    &:hover {
                        color: white;
                        cursor: pointer;
                    }
                }
            }
        }
    }
    .mid-symbol {
        display: flex;
        justify-content: center;
        margin: 5px;
        .btn {
            background: var(--swap-windows);
        }
        &.arrow {
            .btn {
                padding: 5px;
                .icon {
                    margin: 0 4.95px !important;
                }
            }
        }
        &.plus .icon {
            padding: 7.445px 0 !important;
        }
    }
    .tables {
        .columns {
            justify-content: space-around;
            margin-top: 7px;
            padding-top: 7px;
            border-top: 2px solid var(--grey-stroke-sm);
            & > div {
                text-align: center;
                /* flex-basis: 50%; */
                p {
                    white-space: nowrap;
                }
            }
        }
    }
    .buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .infos {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .sum-up {
        margin-top: -5px;
        p:last-of-type {
            white-space: nowrap;
        }
        .ping-cirle {
            width: 3px;
            height: 3px;
            border-radius: 1.5px;
            background-color: var(--primary);
            margin-top: 3px;
            margin-left: 5px;
        }
    }

    .pooled {
        &__item {
            &__symbol {
                margin-left: 6px;
            }
            &__amount {
                margin-left: auto;
            }
            &:first-of-type {
                margin-bottom: 8px;
            }
        }
    }

    .temp-display {
        h4 {
            margin-bottom: 5px;
        }
        & > div > div:not(:has(h4)) {
            margin: 5px 0;
        }
    }
}
</style>
