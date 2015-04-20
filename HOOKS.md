# Hooks
### Global
| Name | args | Description |
|------|------|-------------|
| `global.defaults` | `defaults` | Passes the global defaults prior to merging with args and chart-specific defaults |
| `global.before_init` | `args` | Called before initializing a chart. Allows pre-processing of the arguments passed into `MG.data_graphic`. |
| `x_axis.process_min_max` | `args`, `min_x`, `max_x` | Called after calculating the min and max values for the X axis |
| `y_axis.process_min_max` | `args`, `min_y`, `max_y` | Called after calculating the min and max values for the Y axis |

### Line
| Name | args | Description | Notes |
|------|------|-------------|-------|
| `line.after_init` | `lineChart` - chart descriptor | Called after intializing the chart | |
| `line.after_rollover` | `args` | Called after setting up the rollover | |
| `line.before_all_series` | `args` | Called before rendering the chart. | Returning `false` will prevent the default rendering process from being executed. |
| `line.before_each_series` | `data[i]` - The current data in the for loop <br /> `args` | Called within the render loop, before any other render takes place. | |
| `line.after_each_series` | `data[i]` - The current data in the for loop <br /> `args` | Called within the render loop, after the default render has taken place. | |
